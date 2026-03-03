import React, { useState, useRef, useEffect } from 'react';
import Report from './components/Report';
import SpiralBackground from './components/SpiralBackground';
import FAQItem from './components/AnimatedFAQ';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeFaceLandmarker, analyzeFace } from './utils/faceAnalysis';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure the correct worker path for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function App() {
    const [imageSrc, setImageSrc] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0); // 0: detecting, 1: measuring, 2: calculating
    const [errorMsg, setErrorMsg] = useState('');

    const imageRef = useRef(null);



    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Reset state
        setAnalysisResult(null);
        setErrorMsg('');

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        if (isPdf) {
            setLoading(true);
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                // Get the first page of the PDF
                const page = await pdf.getPage(1);

                // Scale for better image resolution
                const viewport = page.getViewport({ scale: 2.0 });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                const dataUrl = canvas.toDataURL('image/jpeg');
                setImageSrc(dataUrl);
            } catch (err) {
                console.error("PDF Parsing Error:", err);
                setErrorMsg("Failed to process the PDF. Please ensure it is a valid file.");
            } finally {
                setLoading(false);
            }
        } else {
            setImageSrc(URL.createObjectURL(file));
        }
    };

    const handleImageLoad = async () => {
        if (!imageRef.current) return;

        setLoading(true);
        setLoadingStep(0);

        try {
            const faceLandmarker = await initializeFaceLandmarker();
            const results = faceLandmarker.detect(imageRef.current);

            if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
                setErrorMsg("No face detected. Please provide a clearer, single-face frontal image.");
                setAnalysisResult(null);
            } else if (results.faceLandmarks.length > 1) {
                setErrorMsg("Multiple faces detected. Please provide an image with only one face.");
                setAnalysisResult(null);
            } else {
                setLoadingStep(1); // Measuring Ratios

                // Artificial delay to show off the scanning animation and build anticipation
                await new Promise(resolve => setTimeout(resolve, 1200));

                setLoadingStep(2); // Calculating Harmony
                await new Promise(resolve => setTimeout(resolve, 800));

                const analysis = analyzeFace(results.faceLandmarks);
                setAnalysisResult(analysis);
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("An error occurred during analysis. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <SpiralBackground />

            <header className="app-header">
                <motion.h1
                    initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    Golden Ratio Engine
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    AI-Powered Facial Symmetry Calculator
                </motion.p>
            </header>

            <main className="app-main">
                <motion.div
                    className="upload-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                >
                    <label htmlFor="file-upload" className="upload-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2' }}>
                        <span>Upload your image</span>
                        <span style={{ fontSize: '0.65em', opacity: 0.7, marginTop: '4px', fontWeight: 300, textTransform: 'none', letterSpacing: '0.5px' }}>in pdf, jpg, jpeg</span>
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        accept=".pdf, image/jpeg, image/jpg, image/png"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                    />
                    <p className="upload-subtitle">For best results, upload a clear, front-facing portrait with neutral expression.</p>
                </motion.div>

                <div className="prominent-disclaimer">
                    <h4><span className="icon">⚠️</span> Important Notice</h4>
                    <p>Please note that analysis precision can vary depending on photo lighting, camera perspective distortion, head tilt, or minor facial obstructions.</p>
                </div>

                {errorMsg && (
                    <div className="error-message">
                        {errorMsg}
                    </div>
                )}

                <div className="content-grid">
                    {imageSrc && (
                        <div className="image-preview-container">
                            <img
                                ref={imageRef}
                                src={imageSrc}
                                alt="Subject"
                                className="uploaded-image"
                                onLoad={handleImageLoad}
                                crossOrigin="anonymous"
                            />
                            {loading && (
                                <div className="loading-overlay">
                                    <div className="scan-line"></div>
                                    <h3 style={{ color: 'var(--accent-gold)', fontWeight: 300, letterSpacing: '2px', marginBottom: '1rem' }}>
                                        Analyzing Facial Symmetry...
                                    </h3>
                                    <div className="loading-text-container">
                                        <div className={`loading-step ${loadingStep >= 0 ? 'active' : ''}`}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            Detecting Landmarks
                                        </div>
                                        <div className={`loading-step ${loadingStep >= 1 ? 'active' : ''}`}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            Measuring Ratios
                                        </div>
                                        <div className={`loading-step ${loadingStep >= 2 ? 'active' : ''}`}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            Calculating Harmony Score
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {analysisResult && !loading && (
                        <div className="result-container">
                            <Report analysis={analysisResult} />
                        </div>
                    )}
                </div>

                <motion.section
                    className="documentation-section"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    style={{ marginTop: '4rem', textAlign: 'left', maxWidth: '800px', marginInline: 'auto', padding: '0 1rem' }}
                >
                    <h2 className="doc-heading" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Calculate Your Facial Golden Ratio (Phi = 1.618) Instantly</h2>
                    <p className="doc-text" style={{ textAlign: 'left', maxWidth: '100%', marginBottom: '1.5rem' }}>For centuries, architects, artists, and mathematicians have utilized the golden ratio—approximately 1.618—as a standard for aesthetic perfection. From the Parthenon to the Mona Lisa, this specific proportion repeatedly occurs in nature and human-designed masterpieces.</p>
                    <p className="doc-text" style={{ textAlign: 'left', maxWidth: '100%', marginBottom: '2.5rem' }}>Our <strong>facial beauty ratio test</strong> applies these exact mathematical principles to human facial structures. By analyzing the distances between key focal points—such as your eyes, nose, mouth, and jawline—our engine calculates how closely your natural geometry aligns with the classical Phi standard.</p>

                    <h3 className="doc-subheading" style={{ textAlign: 'left', fontSize: '1.4rem' }}>The Science Behind the Analysis</h3>
                    <p className="doc-text" style={{ textAlign: 'left', maxWidth: '100%', marginBottom: '4rem' }}>This tool does not measure subjective "beauty"; instead, it provides a strictly objective <strong>AI facial proportion analysis</strong>. Human faces are naturally asymmetrical. By calculating the micro-variances in your features, the Golden Ratio Engine offers a fascinating, mathematical insight into your unique structural harmony.</p>

                    <h2 className="doc-heading" style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>How Our AI Facial Landmark Detection Works</h2>
                    <p className="doc-text" style={{ textAlign: 'left', maxWidth: '100%', marginBottom: '2rem' }}>The Golden Ratio Engine is entirely automated and highly precise, taking the guesswork out of facial measurement. We have built an <strong>AI facial proportion analysis</strong> pipeline that works directly in your browser.</p>

                    <div style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--accent-gold)', marginBottom: '4rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 500 }}>1. Precision Landmark Mapping</h3>
                        <p className="doc-text" style={{ textAlign: 'left', maxWidth: '100%', marginBottom: '1.5rem', fontSize: '1rem' }}>Once you upload your image, our machine-learning model instantly detects over 60 distinct facial landmarks. It plots the exact coordinates of your pupillary distance, the width of your nasal bridge, the arch of your lips, and the curvature of your chin.</p>

                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 500 }}>2. Mathematical Ratio Calculation</h3>
                        <p className="doc-text" style={{ textAlign: 'left', maxWidth: '100%', marginBottom: '1.5rem', fontSize: '1rem' }}>The engine performs hundreds of rapid geometric calculations. It processes primary ratios, such as your total face length to face width, alongside granular secondary ratios, including the philtrum-to-nose proportion and the intercanthal distance (eye spacing).</p>

                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 500 }}>3. Instant, Privacy-First Results</h3>
                        <p className="doc-text" style={{ textAlign: 'left', maxWidth: '100%', marginBottom: '0', fontSize: '1rem' }}>Because the <strong>face symmetry analyzer</strong> runs on client-side technology, your photo never touches a remote database. The processing completes in milliseconds, generating a comprehensive compliance score out of 100%.</p>
                    </div>

                    <h2 className="doc-heading" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Understanding Your Facial Harmony Measurements</h2>
                    <p className="doc-text" style={{ textAlign: 'left', maxWidth: '100%', marginBottom: '3rem' }}>To fully comprehend your score from the <strong>golden ratio face calculator</strong>, it helps to understand the six fundamental pillars of facial proportion we calculate:</p>

                    <motion.div
                        className="ratio-explanations"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } }
                        }}
                    >
                        <motion.div className="ratio-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                            <h4><span className="phi-highlight">01</span> Face Height Ratio</h4>
                            <p>We measure the vertical thirds of the face. In classical proportion, the distance from the hairline to the nasal bridge, the nasal bridge to the nasal base, and the nasal base to the chin should approach an equal 1:1:1 division, scaling against the total width by a factor of 1.618.</p>
                        </motion.div>
                        <motion.div className="ratio-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                            <h4><span className="phi-highlight">02</span> Eye to Mouth Ratio</h4>
                            <p>This metric evaluates the width of the mouth relative to the inter-pupillary distance. A mathematically harmonious face often displays a specific relational geometry where the corners of the lips align proportionately with the center of the eyes.</p>
                        </motion.div>
                        <motion.div className="ratio-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                            <h4><span className="phi-highlight">03</span> Philtrum to Nose Ratio</h4>
                            <p>The philtrum (the vertical groove between the nose and upper lip) is highly influential in lower-face symmetry. We evaluate its length against the total vertical length of the nose to test for Phi alignment.</p>
                        </motion.div>
                        <motion.div className="ratio-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                            <h4><span className="phi-highlight">04</span> Face Width Ratio</h4>
                            <p>By analyzing facial width across three distinct horizontal axes (forehead contour, zygomatic/cheekbone arch, and mandibular/jaw angle), the AI determines the tapering harmony of your overall face shape.</p>
                        </motion.div>
                        <motion.div className="ratio-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                            <h4><span className="phi-highlight">05</span> Eye Spacing</h4>
                            <p>Ideally, classical art principles dictate that the distance between the two eyes should perfectly equal the width of one single eye. Our face symmetry analyzer measures this exact pixel ratio.</p>
                        </motion.div>
                        <motion.div className="ratio-card" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                            <h4><span className="phi-highlight">06</span> Overall Harmony</h4>
                            <p>We aggregate these micro-calculations into a macro-weighted percentage. An 85% or higher indicates a very high degree of classical mathematical symmetry, though virtually no human face possesses a flawless 100% score.</p>
                        </motion.div>
                    </motion.div>

                    <motion.h2 className="doc-heading" style={{ fontSize: '2rem', marginTop: '5rem', marginBottom: '2rem' }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                        Frequently Asked Questions (FAQ)
                    </motion.h2>
                    <div className="faq-container">
                        <FAQItem
                            question="What is the golden ratio in facial analysis?"
                            answer="The golden ratio, colloquially known as Phi (1.618), is a mathematical constant that appears frequently in nature and art. In facial analysis, it is used as a geometric benchmark to measure the proportional distance and harmony between facial features, such as the eyes, nose, and mouth."
                        />
                        <FAQItem
                            question="How is the golden ratio measured in faces?"
                            answer="Our golden ratio face calculator uses AI to map specific coordinates on the face. It measures the lengths and widths of features, divides them by one another, and compares the resulting quotient to the ideal 1.618 to calculate a percentage-based harmony score."
                        />
                        <FAQItem
                            question="Is the golden ratio the only measure of facial beauty?"
                            answer="No. The golden ratio is a mathematical and historical standard, not an absolute rule. Beauty is subjective, culturally diverse, and deeply personal. Our facial beauty ratio test provides a fun, objective look into geometric symmetry, not an absolute judgement of attractiveness."
                        />
                        <FAQItem
                            question="How accurate is the AI face symmetry analyzer?"
                            answer="Our AI facial landmark detection is highly precise at plotting coordinates. However, overall accuracy depends heavily on your uploaded image. For best results, use a well-lit, front-facing portrait with a completely neutral expression and no obstructions (such as glasses or heavy bangs)."
                        />
                        <FAQItem
                            question="Does the golden ratio differ across ethnicities?"
                            answer="Yes. Natural facial proportions, bone structures, and features vary significantly across different global populations. The golden ratio (1.618) is heavily rooted in classical European art aesthetics and should be viewed as one specific historical framework, rather than a universal necessity."
                        />
                        <FAQItem
                            question="Is my photo safe when using this tool?"
                            answer="Absolutely. The entire AI facial proportion analysis occurs locally within your web browser. Your photo is never uploaded to an external server, stored in a database, or shared with third parties. Your privacy is mathematically guaranteed."
                        />
                    </div>
                </motion.section>
            </main>

            <footer className="app-footer">
                <div className="footer-top">
                    <div className="footer-brand">Golden Ratio Engine</div>
                    <div className="footer-links">
                        <a href="#">Other tools</a>
                        <a href="#">Data privacy</a>
                    </div>
                </div>
                <div className="copyright">Copyrights &copy; 2026 GoldenRatioEngine</div>
            </footer>
        </div>
    );
}

export default App;
