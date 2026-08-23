import os

import cv2
import numpy as np


MODEL_VERSION = "baseline-v4-grabcut"

MAX_DIMENSION = 1200


def failed_result():
    return {
        "status": "FAILED",
        "wound_area_pixels": None,
        "wound_area": None,
        "confidence": None,
        "model_version": MODEL_VERSION,
        "mask_path": None,
    }


def analyze_wound_image(image_path):
    """
    Experimental GrabCut wound segmentation.

    This is NOT a clinically validated model.

    Strategy:
    1. Load the wound image.
    2. Resize large images to reduce memory and processing time.
    3. Create a central rectangle where the wound is likely located.
    4. Use GrabCut to separate foreground from background.
    5. Clean the result.
    6. Keep the most plausible connected wound region.
    7. Save the mask.
    8. Return estimated raw pixel area.

    Real cm² measurement still requires calibration.
    """

    # --------------------------------------------------
    # 1. LOAD IMAGE
    # --------------------------------------------------

    image = cv2.imread(image_path)

    if image is None:
        print(
            "WOUND ANALYSIS: Could not read image."
        )

        return failed_result()

    original_height, original_width = (
        image.shape[:2]
    )

    print(
        "WOUND ANALYSIS: "
        f"original image size = "
        f"{original_width} x "
        f"{original_height}"
    )

    # --------------------------------------------------
    # 2. RESIZE LARGE IMAGES
    # --------------------------------------------------
    #
    # Large phone images can use too much RAM during
    # GrabCut on small Render instances.
    #
    # We therefore analyze a smaller copy.
    # --------------------------------------------------

    scale = min(
        1.0,
        MAX_DIMENSION
        / max(
            original_width,
            original_height,
        )
    )

    if scale < 1.0:
        width = max(
            1,
            int(
                original_width
                * scale
            ),
        )

        height = max(
            1,
            int(
                original_height
                * scale
            ),
        )

        image = cv2.resize(
            image,
            (
                width,
                height,
            ),
            interpolation=cv2.INTER_AREA,
        )

        print(
            "WOUND ANALYSIS: "
            f"resized image to "
            f"{width} x {height}"
        )

    else:
        height, width = (
            original_height,
            original_width,
        )

        print(
            "WOUND ANALYSIS: "
            "resize not required"
        )

    # --------------------------------------------------
    # 3. INITIAL GRABCUT MASK
    # --------------------------------------------------

    grabcut_mask = np.zeros(
        (
            height,
            width,
        ),
        dtype=np.uint8,
    )

    background_model = np.zeros(
        (
            1,
            65,
        ),
        np.float64,
    )

    foreground_model = np.zeros(
        (
            1,
            65,
        ),
        np.float64,
    )

    # --------------------------------------------------
    # 4. DEFINE INITIAL REGION
    # --------------------------------------------------
    #
    # For now we assume the wound is reasonably central
    # in the image.
    # --------------------------------------------------

    rect_x = int(
        width * 0.20
    )

    rect_y = int(
        height * 0.15
    )

    rect_width = int(
        width * 0.60
    )

    rect_height = int(
        height * 0.70
    )

    rectangle = (
        rect_x,
        rect_y,
        rect_width,
        rect_height,
    )

    # --------------------------------------------------
    # 5. RUN GRABCUT
    # --------------------------------------------------

    try:
        cv2.grabCut(
            image,
            grabcut_mask,
            rectangle,
            background_model,
            foreground_model,
            5,
            cv2.GC_INIT_WITH_RECT,
        )

    except cv2.error as error:
        print(
            "WOUND ANALYSIS: "
            "GrabCut failed:",
            error,
        )

        return failed_result()

    # GrabCut output labels:
    # 0 = sure background
    # 1 = sure foreground
    # 2 = probable background
    # 3 = probable foreground

    binary_mask = np.where(
        (
            grabcut_mask
            == cv2.GC_FGD
        )
        |
        (
            grabcut_mask
            == cv2.GC_PR_FGD
        ),
        255,
        0,
    ).astype(
        np.uint8
    )

    # --------------------------------------------------
    # 6. ADD WOUND-LIKE COLOR INFORMATION
    # --------------------------------------------------

    lab = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2LAB,
    )

    a_channel = (
        lab[:, :, 1]
    )

    redness_threshold = (
        np.percentile(
            a_channel,
            75,
        )
    )

    redness_mask = np.zeros(
        (
            height,
            width,
        ),
        dtype=np.uint8,
    )

    redness_mask[
        a_channel
        >= redness_threshold
    ] = 255

    combined_mask = (
        cv2.bitwise_and(
            binary_mask,
            redness_mask,
        )
    )

    # --------------------------------------------------
    # 7. CLEAN THE MASK
    # --------------------------------------------------

    kernel_small = np.ones(
        (
            3,
            3,
        ),
        np.uint8,
    )

    kernel_large = np.ones(
        (
            9,
            9,
        ),
        np.uint8,
    )

    combined_mask = (
        cv2.morphologyEx(
            combined_mask,
            cv2.MORPH_OPEN,
            kernel_small,
        )
    )

    combined_mask = (
        cv2.morphologyEx(
            combined_mask,
            cv2.MORPH_CLOSE,
            kernel_large,
        )
    )

    # --------------------------------------------------
    # 8. FIND CONNECTED REGIONS
    # --------------------------------------------------

    contours, _ = (
        cv2.findContours(
            combined_mask,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE,
        )
    )

    print(
        "WOUND ANALYSIS: "
        f"{len(contours)} "
        "contours found"
    )

    if not contours:
        return failed_result()

    image_area = float(
        height * width
    )

    center_x = (
        width / 2.0
    )

    center_y = (
        height / 2.0
    )

    candidates = []

    for contour in contours:
        area = (
            cv2.contourArea(
                contour
            )
        )

        if area < 100:
            continue

        area_ratio = (
            area
            / image_area
        )

        if area_ratio > 0.30:
            continue

        moments = (
            cv2.moments(
                contour
            )
        )

        if moments["m00"] == 0:
            continue

        contour_x = (
            moments["m10"]
            / moments["m00"]
        )

        contour_y = (
            moments["m01"]
            / moments["m00"]
        )

        distance_from_center = (
            np.sqrt(
                (
                    contour_x
                    - center_x
                )
                ** 2
                +
                (
                    contour_y
                    - center_y
                )
                ** 2
            )
        )

        maximum_distance = (
            np.sqrt(
                center_x ** 2
                +
                center_y ** 2
            )
        )

        centrality = max(
            0.0,
            1.0
            - (
                distance_from_center
                / maximum_distance
            ),
        )

        score = (
            area
            * (
                0.5
                + centrality
            )
        )

        print(
            "Candidate:",
            "area =",
            round(
                area,
                1,
            ),
            "ratio =",
            round(
                area_ratio,
                3,
            ),
            "centrality =",
            round(
                centrality,
                3,
            ),
            "score =",
            round(
                score,
                1,
            ),
        )

        candidates.append(
            {
                "contour":
                    contour,

                "area":
                    area,

                "score":
                    score,
            }
        )

    if not candidates:
        print(
            "WOUND ANALYSIS: "
            "No valid GrabCut "
            "wound candidate."
        )

        return failed_result()

    # --------------------------------------------------
    # 9. SELECT BEST REGION
    # --------------------------------------------------

    best_candidate = max(
        candidates,
        key=lambda item:
            item["score"],
    )

    wound_contour = (
        best_candidate[
            "contour"
        ]
    )

    processed_area = (
        best_candidate[
            "area"
        ]
    )

    # --------------------------------------------------
    # 10. SCALE AREA BACK TO ORIGINAL IMAGE SIZE
    # --------------------------------------------------

    if scale < 1.0:
        wound_area_pixels = (
            processed_area
            / (
                scale ** 2
            )
        )

    else:
        wound_area_pixels = (
            processed_area
        )

    print(
        "WOUND ANALYSIS: "
        "selected processed area =",
        processed_area,
        "pixels"
    )

    print(
        "WOUND ANALYSIS: "
        "estimated original area =",
        wound_area_pixels,
        "pixels"
    )

    # --------------------------------------------------
    # 11. CREATE FINAL MASK
    # --------------------------------------------------

    final_mask = np.zeros(
        (
            height,
            width,
        ),
        dtype=np.uint8,
    )

    cv2.drawContours(
        final_mask,
        [
            wound_contour
        ],
        -1,
        255,
        thickness=-1,
    )

    # --------------------------------------------------
    # 12. RESIZE MASK BACK TO ORIGINAL IMAGE SIZE
    # --------------------------------------------------

    if scale < 1.0:
        final_mask = (
            cv2.resize(
                final_mask,
                (
                    original_width,
                    original_height,
                ),
                interpolation=(
                    cv2.INTER_NEAREST
                ),
            )
        )

    # --------------------------------------------------
    # 13. SAVE MASK
    # --------------------------------------------------

    image_directory = (
        os.path.dirname(
            image_path
        )
    )

    media_directory = (
        os.path.dirname(
            image_directory
        )
    )

    mask_directory = (
        os.path.join(
            media_directory,
            "wound_masks",
        )
    )

    os.makedirs(
        mask_directory,
        exist_ok=True,
    )

    original_filename = (
        os.path.basename(
            image_path
        )
    )

    (
        filename_without_extension,
        _,
    ) = os.path.splitext(
        original_filename
    )

    mask_filename = (
        f"{filename_without_extension}"
        f"_mask.png"
    )

    mask_full_path = (
        os.path.join(
            mask_directory,
            mask_filename,
        )
    )

    saved = cv2.imwrite(
        mask_full_path,
        final_mask,
    )

    if not saved:
        print(
            "WOUND ANALYSIS: "
            "Could not save "
            "wound mask."
        )

        return failed_result()

    # --------------------------------------------------
    # 14. RETURN RESULT
    # --------------------------------------------------

    return {
        "status":
            "COMPLETED",

        "wound_area_pixels":
            float(
                wound_area_pixels
            ),

        # Still no physical calibration.
        "wound_area":
            None,

        "confidence":
            None,

        "model_version":
            MODEL_VERSION,

        "mask_path":
            (
                "wound_masks/"
                f"{mask_filename}"
            ),
    }