import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarker = null;

export const initializeFaceLandmarker = async () => {
    if (faceLandmarker) return faceLandmarker;

    const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );

    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
        },
        outputFaceBlendshapes: false,
        runningMode: "IMAGE",
        numFaces: 1
    });

    return faceLandmarker;
};

const calculateDistance = (p1, p2) => {
    if (!p1 || !p2) return 0;
    return Math.sqrt(
        Math.pow(p2.x - p1.x, 2) +
        Math.pow(p2.y - p1.y, 2) +
        Math.pow(p2.z - p1.z, 2)
    );
};

export const analyzeFace = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return null;

    const pts = landmarks[0];

    // Landmark Indices Mapping
    const TopOfForehead = pts[10];
    const ChinTip = pts[152];
    const LeftCheekbone = pts[234];
    const RightCheekbone = pts[454];

    // Pupils: MediaPipe with Iris tracking gives 478 landmarks. 
    // Left pupil is 468, right pupil is 473. If not available, we average eye corners.
    const LeftPupil = pts[468] || { x: (pts[33].x + pts[133].x) / 2, y: (pts[33].y + pts[133].y) / 2, z: (pts[33].z + pts[133].z) / 2 };
    const RightPupil = pts[473] || { x: (pts[362].x + pts[263].x) / 2, y: (pts[362].y + pts[263].y) / 2, z: (pts[362].z + pts[263].z) / 2 };

    const NoseBridge = pts[168];
    const NoseTip = pts[1];
    const LeftNostril = pts[98];
    const RightNostril = pts[327];

    const LeftLipCorner = pts[61];
    const RightLipCorner = pts[291];

    const LeftInnerEye = pts[133];
    const LeftOuterEye = pts[33];
    const RightInnerEye = pts[362];
    const RightOuterEye = pts[263];

    const EyebrowMidpoint = pts[9];
    const BaseOfNose = pts[164];

    // 1. Calculate Distances
    const distances = {
        faceLength: calculateDistance(TopOfForehead, ChinTip),
        faceWidth: calculateDistance(LeftCheekbone, RightCheekbone),
        eyeDistance: calculateDistance(LeftPupil, RightPupil),
        noseLength: calculateDistance(NoseBridge, NoseTip),
        noseWidth: calculateDistance(LeftNostril, RightNostril),
        mouthWidth: calculateDistance(LeftLipCorner, RightLipCorner),
        leftEyeWidth: calculateDistance(LeftInnerEye, LeftOuterEye),
        rightEyeWidth: calculateDistance(RightInnerEye, RightOuterEye),
        upperFaceLength: calculateDistance(TopOfForehead, EyebrowMidpoint),
        midFaceLength: calculateDistance(EyebrowMidpoint, BaseOfNose),
        lowerFaceLength: calculateDistance(BaseOfNose, ChinTip)
    };

    const avgEyeWidth = (distances.leftEyeWidth + distances.rightEyeWidth) / 2;

    // 2. Calculate Golden Ratios and Closeness
    const calculateCloseness = (measuredRatio) => {
        const PHI = 1.618;
        // Cap closeness between 0 and 100
        let closeness = (1 - Math.abs(measuredRatio - PHI) / PHI) * 100;
        return Math.max(0, Math.min(100, closeness));
    };

    const calculateRatio = (v1, v2) => {
        if (v2 === 0) return 0;
        // Ratio should ideally be >= 1 for comparison to 1.618, 
        // so we take max/min to ensure it's always the larger over the smaller
        return Math.max(v1, v2) / Math.min(v1, v2);
    };

    const faceProportionRatio = calculateRatio(distances.faceLength, distances.faceWidth);
    const upperToMidRatio = calculateRatio(distances.upperFaceLength, distances.midFaceLength);
    const midToLowerRatio = calculateRatio(distances.midFaceLength, distances.lowerFaceLength);
    const mouthToNoseRatio = calculateRatio(distances.mouthWidth, distances.noseWidth);
    const eyeDistanceToWidthRatio = calculateRatio(distances.eyeDistance, avgEyeWidth);
    const noseLengthToWidthRatio = calculateRatio(distances.noseLength, distances.noseWidth);

    const scores = {
        faceProportion: calculateCloseness(faceProportionRatio),
        upperToMid: calculateCloseness(upperToMidRatio),
        midToLower: calculateCloseness(midToLowerRatio),
        mouthToNose: calculateCloseness(mouthToNoseRatio),
        eyeSpacing: calculateCloseness(eyeDistanceToWidthRatio),
        noseProportion: calculateCloseness(noseLengthToWidthRatio)
    };

    // Vertical Thirds Analysis logic
    // A balanced face has roughly equal thirds (1:1:1). 
    // In terms of phi, some classical measures compare upper+mid to mid+lower etc., 
    // The user requested Upper/Mid and Mid/Lower balance analysis.
    // We'll average those two for the "Vertical Thirds Balance" score.
    const verticalThirdsScore = (scores.upperToMid + scores.midToLower) / 2;

    // 3. Compute Final Score
    // Weights:
    // Face Proportion Ratio = 25%
    // Eye Spacing Ratio = 15%
    // Nose Proportion = 15%
    // Mouth Proportion = 15%
    // Vertical Thirds Balance = 20%
    // Overall Symmetry = 10%

    // Compute Overall Symmetry score (comparing left/right eye widths, and distances from center)
    // Simple overall symmetry proxy: similarity of left/right eye widths.
    const eyeSim = 1 - Math.abs(distances.leftEyeWidth - distances.rightEyeWidth) / Math.max(distances.leftEyeWidth, distances.rightEyeWidth);
    const symmetryScore = Math.max(0, eyeSim * 100);

    const finalScore =
        (scores.faceProportion * 0.25) +
        (scores.eyeSpacing * 0.15) +
        (scores.noseProportion * 0.15) +
        (scores.mouthToNose * 0.15) +
        (verticalThirdsScore * 0.20) +
        (symmetryScore * 0.10);

    return {
        distances,
        ratios: {
            faceProportion: faceProportionRatio,
            upperToMid: upperToMidRatio,
            midToLower: midToLowerRatio,
            mouthToNose: mouthToNoseRatio,
            eyeSpacing: eyeDistanceToWidthRatio,
            noseProportion: noseLengthToWidthRatio
        },
        scores: {
            faceProportion: scores.faceProportion,
            upperToMid: scores.upperToMid,
            midToLower: scores.midToLower,
            mouthToNose: scores.mouthToNose,
            eyeSpacing: scores.eyeSpacing,
            noseProportion: scores.noseProportion,
            verticalThirds: verticalThirdsScore,
            symmetry: symmetryScore
        },
        finalScore: Math.round(finalScore)
    };
};
