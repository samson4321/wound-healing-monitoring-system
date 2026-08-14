from django.db import models
from django.contrib.auth.models import User


class StaffProfile(models.Model):

    ROLE_CHOICES = [
        ("NURSE", "Nurse / Wound Assessor"),
        ("DOCTOR", "Doctor / Clinician"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="staff_profile"
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )

    staff_id = models.CharField(
        max_length=50,
        unique=True
    )

    department = models.CharField(
        max_length=100,
        blank=True
    )

    is_approved = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.role}"