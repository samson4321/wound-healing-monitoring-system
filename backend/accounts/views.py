from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import StaffProfile

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    StaffProfileSerializer,
)


# ==================================================
# STAFF REGISTRATION
# ==================================================

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


# ==================================================
# LOGIN
# ==================================================

class LoginView(APIView):

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        username = serializer.validated_data[
            "username"
        ]

        password = serializer.validated_data[
            "password"
        ]

        # ------------------------------------------
        # CHECK USERNAME AND PASSWORD
        # ------------------------------------------

        user = authenticate(
            username=username,
            password=password
        )

        if user is None:
            return Response(
                {
                    "message":
                    "Invalid username or password."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        # ------------------------------------------
        # CREATE OR GET API TOKEN
        # ------------------------------------------

        token, created = Token.objects.get_or_create(
            user=user
        )

        # ------------------------------------------
        # SUPERUSER / ADMIN LOGIN
        # ------------------------------------------

        if user.is_superuser:
            return Response(
                {
                    "message":
                    "Login successful.",

                    "username":
                    user.username,

                    "first_name":
                    user.first_name,

                    "last_name":
                    user.last_name,

                    "role":
                    "ADMIN",

                    "token":
                    token.key,
                },
                status=status.HTTP_200_OK
            )

        # ------------------------------------------
        # NORMAL STAFF PROFILE
        # ------------------------------------------

        try:
            profile = user.staff_profile

        except StaffProfile.DoesNotExist:
            return Response(
                {
                    "message":
                    "No staff profile is associated with this account."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # ------------------------------------------
        # CHECK ADMIN APPROVAL
        # ------------------------------------------

        if not profile.is_approved:
            return Response(
                {
                    "message":
                    "Your account is awaiting administrator approval."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # ------------------------------------------
        # SUCCESSFUL STAFF LOGIN
        # ------------------------------------------

        return Response(
            {
                "message":
                "Login successful.",

                "username":
                user.username,

                "first_name":
                user.first_name,

                "last_name":
                user.last_name,

                "role":
                profile.role,

                "token":
                token.key,
            },
            status=status.HTTP_200_OK
        )


# ==================================================
# ADMIN - LIST STAFF ACCOUNTS
# ==================================================

class StaffProfileListView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        # Only Django superusers can manage staff
        if not request.user.is_superuser:
            return Response(
                {
                    "message":
                    "Administrator access required."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        profiles = StaffProfile.objects.select_related(
            "user"
        ).order_by(
            "-created_at"
        )

        serializer = StaffProfileSerializer(
            profiles,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


# ==================================================
# ADMIN - APPROVE / REVOKE STAFF ACCOUNT
# ==================================================

class StaffProfileApprovalView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    def patch(
        self,
        request,
        pk
    ):

        # Only Django superusers can manage staff
        if not request.user.is_superuser:
            return Response(
                {
                    "message":
                    "Administrator access required."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            profile = StaffProfile.objects.select_related(
                "user"
            ).get(
                pk=pk
            )

        except StaffProfile.DoesNotExist:
            return Response(
                {
                    "message":
                    "Staff profile not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # ------------------------------------------
        # READ APPROVAL VALUE
        # ------------------------------------------

        is_approved = request.data.get(
            "is_approved"
        )

        if not isinstance(
            is_approved,
            bool
        ):
            return Response(
                {
                    "message":
                    "is_approved must be true or false."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ------------------------------------------
        # SAVE APPROVAL
        # ------------------------------------------

        profile.is_approved = (
            is_approved
        )

        profile.save(
            update_fields=[
                "is_approved"
            ]
        )

        serializer = StaffProfileSerializer(
            profile
        )

        return Response(
            {
                "message":
                (
                    "Staff account approved successfully."
                    if is_approved
                    else
                    "Staff approval removed successfully."
                ),

                "staff":
                    serializer.data,
            },
            status=status.HTTP_200_OK
        )