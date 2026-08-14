from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, LoginSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


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

        # Check username and password
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

        except User.staff_profile.RelatedObjectDoesNotExist:
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