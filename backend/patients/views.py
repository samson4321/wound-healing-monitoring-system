import logging
import os
import tempfile

from django.core.files import File
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


logger = logging.getLogger(__name__)


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

        if not assessment.wound_image:
            return

        temp_input_path = None
        temp_mask_path = None

        try:
            # ------------------------------------------
            # COPY STORED IMAGE TO TEMPORARY LOCAL FILE
            # ------------------------------------------

            suffix = os.path.splitext(
                assessment.wound_image.name
            )[1]

            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=suffix or ".jpg"
            ) as temp_input:

                assessment.wound_image.open("rb")

                for chunk in (
                    assessment.wound_image.chunks()
                ):
                    temp_input.write(
                        chunk
                    )

                temp_input_path = (
                    temp_input.name
                )

            assessment.wound_image.close()

            logger.info(
                "WOUND ASSESSMENT: "
                "temporary input file created: %s",
                temp_input_path,
            )

            # ------------------------------------------
            # RUN IMAGE ANALYSIS
            # ------------------------------------------

            result = analyze_wound_image(
                temp_input_path
            )

            logger.info(
                "WOUND ASSESSMENT: "
                "analysis result status = %s",
                result.get("status"),
            )

            assessment.analysis_status = (
                result["status"]
            )

            assessment.wound_area_pixels = (
                result["wound_area_pixels"]
            )

            if (
                result["wound_area_pixels"]
                is not None
            ):
                assessment.measurement_source = (
                    "SEGMENTATION_PIXELS"
                )

            assessment.wound_area = (
                result["wound_area"]
            )

            assessment.analysis_confidence = (
                result["confidence"]
            )

            assessment.model_version = (
                result["model_version"]
            )

            # ------------------------------------------
            # SAVE GENERATED MASK USING DJANGO STORAGE
            # ------------------------------------------

            temp_mask_path = result.get(
                "mask_full_path"
            )

            if (
                temp_mask_path
                and os.path.exists(
                    temp_mask_path
                )
            ):
                mask_filename = (
                    os.path.basename(
                        temp_mask_path
                    )
                )

                logger.info(
                    "WOUND ASSESSMENT: "
                    "saving mask through Django storage: %s",
                    mask_filename,
                )

                with open(
                    temp_mask_path,
                    "rb"
                ) as mask_file:

                    assessment.wound_mask.save(
                        mask_filename,
                        File(mask_file),
                        save=False,
                    )

            # ------------------------------------------
            # SAVE ANALYSIS RESULT
            # ------------------------------------------

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

            logger.info(
                "WOUND ASSESSMENT: "
                "assessment %s saved successfully",
                assessment.pk,
            )

        except Exception:
            # ------------------------------------------
            # IMPORTANT:
            # PRINT FULL ERROR TO RENDER LOGS
            # ------------------------------------------

            logger.exception(
                "WOUND ASSESSMENT CREATE FAILED "
                "for assessment id=%s",
                assessment.pk,
            )

            raise

        finally:
            # ------------------------------------------
            # DELETE TEMPORARY INPUT IMAGE
            # ------------------------------------------

            if (
                temp_input_path
                and os.path.exists(
                    temp_input_path
                )
            ):
                os.remove(
                    temp_input_path
                )

            # ------------------------------------------
            # DELETE TEMPORARY GENERATED MASK
            # ------------------------------------------

            if (
                temp_mask_path
                and os.path.exists(
                    temp_mask_path
                )
            ):
                os.remove(
                    temp_mask_path
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
class WoundAssessmentReviewView(
    APIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def patch(
        self,
        request,
        pk
    ):
        user = request.user

        # ------------------------------------------
        # CHECK DOCTOR ROLE
        # ------------------------------------------

        if user.is_superuser:
            role = "ADMIN"

        else:
            try:
                role = (
                    user.staff_profile.role
                )

            except Exception:
                return Response(
                    {
                        "message":
                            "No staff profile is "
                            "associated with this "
                            "account."
                    },
                    status=(
                        status.HTTP_403_FORBIDDEN
                    ),
                )

        if role != "DOCTOR":
            return Response(
                {
                    "message":
                        "Only doctors can review "
                        "wound assessments."
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                ),
            )

        # ------------------------------------------
        # FIND ASSESSMENT
        # ------------------------------------------

        try:
            assessment = (
                WoundAssessment.objects.get(
                    pk=pk
                )
            )

        except (
            WoundAssessment.DoesNotExist
        ):
            return Response(
                {
                    "message":
                        "Assessment not found."
                },
                status=(
                    status.HTTP_404_NOT_FOUND
                ),
            )

        # ------------------------------------------
        # GET DOCTOR COMMENT
        # ------------------------------------------

        doctor_comment = (
            request.data.get(
                "doctor_comment",
                ""
            ).strip()
        )

        if not doctor_comment:
            return Response(
                {
                    "message":
                        "Doctor comment is required."
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        # ------------------------------------------
        # SAVE REVIEW
        # ------------------------------------------

        assessment.doctor_comment = (
            doctor_comment
        )

        assessment.review_status = (
            "REVIEWED"
        )

        assessment.reviewed_at = (
            timezone.now()
        )

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

        # ------------------------------------------
        # RETURN UPDATED ASSESSMENT
        # ------------------------------------------

        serializer = (
            WoundAssessmentSerializer(
                assessment,
                context={
                    "request": request
                },
            )
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )