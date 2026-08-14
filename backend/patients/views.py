from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Patient, WoundAssessment
from .serializers import (
    PatientSerializer,
    WoundAssessmentSerializer,
)
from .wound_analysis import analyze_wound_image


class PatientListCreateView(
    generics.ListCreateAPIView
):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]


class WoundAssessmentListCreateView(
    generics.ListCreateAPIView
):
    queryset = WoundAssessment.objects.all()
    serializer_class = WoundAssessmentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        assessment = serializer.save()

        if assessment.wound_image:
            result = analyze_wound_image(
                assessment.wound_image.path
            )

            assessment.analysis_status = result[
                "status"
            ]

            assessment.wound_area_pixels = result[
                "wound_area_pixels"
            ]

            # Record how this measurement was obtained
            if (
                result["wound_area_pixels"]
                is not None
            ):
                assessment.measurement_source = (
                    "SEGMENTATION_PIXELS"
                )

            assessment.wound_area = result[
                "wound_area"
            ]

            assessment.analysis_confidence = result[
                "confidence"
            ]

            assessment.model_version = result[
                "model_version"
            ]

            if result["mask_path"]:
                assessment.wound_mask = result[
                    "mask_path"
                ]

            assessment.save(
                update_fields=[
                    "analysis_status",
                    "wound_area_pixels",
                    "measurement_source",
                    "wound_area",
                    "analysis_confidence",
                    "model_version",
                    "wound_mask",
                ]
            )


# Read one assessment.
# No general update access here.
class WoundAssessmentDetailView(
    generics.RetrieveAPIView
):
    queryset = WoundAssessment.objects.all()
    serializer_class = WoundAssessmentSerializer
    permission_classes = [IsAuthenticated]


# Doctor-only review endpoint
class WoundAssessmentReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        user = request.user

        # --------------------------------------------------
        # CHECK DOCTOR ROLE
        # --------------------------------------------------

        if user.is_superuser:
            role = "ADMIN"
        else:
            try:
                role = user.staff_profile.role
            except Exception:
                return Response(
                    {
                        "message":
                        "No staff profile is associated with this account."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        if role != "DOCTOR":
            return Response(
                {
                    "message":
                    "Only doctors can review wound assessments."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # --------------------------------------------------
        # FIND ASSESSMENT
        # --------------------------------------------------

        try:
            assessment = WoundAssessment.objects.get(
                pk=pk
            )
        except WoundAssessment.DoesNotExist:
            return Response(
                {
                    "message":
                    "Assessment not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # --------------------------------------------------
        # GET DOCTOR COMMENT
        # --------------------------------------------------

        doctor_comment = request.data.get(
            "doctor_comment",
            ""
        ).strip()

        if not doctor_comment:
            return Response(
                {
                    "message":
                    "Doctor comment is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # --------------------------------------------------
        # SAVE REVIEW
        # --------------------------------------------------

        assessment.doctor_comment = doctor_comment

        assessment.review_status = "REVIEWED"

        assessment.reviewed_at = timezone.now()

        assessment.reviewed_by = (
            user.get_full_name().strip()
            or user.username
        )

        assessment.save(
            update_fields=[
                "doctor_comment",
                "review_status",
                "reviewed_at",
                "reviewed_by",
            ]
        )

        # --------------------------------------------------
        # RETURN UPDATED ASSESSMENT
        # --------------------------------------------------

        serializer = WoundAssessmentSerializer(
            assessment,
            context={
                "request": request
            }
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )