import React from 'react';
import { FaBrain, FaClock, FaRandom, FaLightbulb, FaExchangeAlt, FaPuzzlePiece } from 'react-icons/fa';
import './TechniqueBanner.css';

/**
 * Component that displays information about the learning technique being used
 * in the current quiz to help students understand the cognitive benefits
 */
const TechniqueBanner = ({ type }) => {
    // Render content based on quiz type/technique
    const renderContent = () => {
        switch(type) {
            case 'recall':
                return {
                    icon: <FaBrain className="technique-icon" />,
                    title: "Active Recall",
                    description: "Testing yourself strengthens memory more than simply re-reading material.",
                    color: "#e8f5e9"
                };
            case 'spaced-repetition':
                return {
                    icon: <FaClock className="technique-icon" />,
                    title: "Spaced Repetition",
                    description: "Reviewing material at optimal intervals moves knowledge into long-term memory.",
                    color: "#e3f2fd"
                };
            case 'interleaved':
                return {
                    icon: <FaRandom className="technique-icon" />,
                    title: "Interleaved Practice",
                    description: "Mixing different problem types improves your ability to select appropriate strategies.",
                    color: "#fff8e1"
                };
            case 'encoding':
                return {
                    icon: <FaLightbulb className="technique-icon" />,
                    title: "Encoding Techniques",
                    description: "Using mnemonics and memory strategies creates stronger neural pathways.",
                    color: "#f3e5f5"
                };
            case 'contextual-variation':
                return {
                    icon: <FaExchangeAlt className="technique-icon" />,
                    title: "Contextual Variation",
                    description: "Applying concepts in different contexts builds flexible, transferable knowledge.",
                    color: "#e0f7fa"
                };
            case 'chunking':
                return {
                    icon: <FaPuzzlePiece className="technique-icon" />,
                    title: "Chunking",
                    description: "Breaking complex topics into smaller pieces makes them easier to understand and remember.",
                    color: "#f5f5f5"
                };
            default:
                return {
                    icon: <FaLightbulb className="technique-icon" />,
                    title: "Quiz",
                    description: "Test your knowledge of the material.",
                    color: "#f5f5f5"
                };
        }
    };

    const content = renderContent();

    return (
        <div className="technique-banner" style={{ backgroundColor: content.color }}>
            <div className="technique-icon-container">
                {content.icon}
            </div>
            <div className="technique-content">
                <h3>{content.title}</h3>
                <p>{content.description}</p>
            </div>
        </div>
    );
};

export default TechniqueBanner;
