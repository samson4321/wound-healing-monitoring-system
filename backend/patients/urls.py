from django.urls import path

from .views import (
    PatientListCreateView,
    WoundAssessmentListCreateView,
    WoundAssessmentDetailView,
    WoundAssessmentReviewView,
)


urlpatterns = [
    path(
        "patients/",
        PatientListCreateView.as_view(),
        name="patients",
    ),

    path(
        "assessments/",
        WoundAssessmentListCreateView.as_view(),
        name="assessments",
    ),

    path(
        "assessments/<int:pk>/",
        WoundAssessmentDetailView.as_view(),
        name="assessment-detail",
    ),

    path(
        "assessments/<int:pk>/review/",
        WoundAssessmentReviewView.as_view(),
        name="assessment-review",
    ),
]