from django.contrib.auth.models import User
from rest_framework import serializers
from .models import StaffProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True
    )

    role = serializers.ChoiceField(
        choices=StaffProfile.ROLE_CHOICES,
        write_only=True
    )

    staff_id = serializers.CharField(
        write_only=True
    )

    department = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True
    )

    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "password",
            "role",
            "staff_id",
            "department",
        ]

    def create(self, validated_data):
        role = validated_data.pop("role")
        staff_id = validated_data.pop("staff_id")
        department = validated_data.pop("department", "")

        user = User.objects.create_user(
            username=validated_data["username"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )

        StaffProfile.objects.create(
            user=user,
            role=role,
            staff_id=staff_id,
            department=department,
            is_approved=False,
        )

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()

    password = serializers.CharField(
        write_only=True
    )