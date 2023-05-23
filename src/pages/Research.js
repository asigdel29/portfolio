import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import CPSModal from "../Components/ModalContent/CPSModal";
import FreeMoCapModal from "../Components/ModalContent/FreeMoCapModal";
import InternationalTradeModal from "../Components/ModalContent/InternationalTradeModal";

const Research = () => {
    const navigate = useNavigate();
    const [isAnimatingClose, setIsAnimatingClose] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isCPSOpen, setIsCPSOpen] = useState(false);
    const [isMotionCaptureOpen, setIsMotionCaptureOpen] = useState(false);
    const [isInternationalTradeOpen, setIsInternationalTradeOpen] = useState(false);

    const closeModal = (modalType) => {
        if (isClosing) return;

        setIsClosing(true);
        setTimeout(() => {
            if (modalType === 'cps') {
                setIsCPSOpen(false);
            } else if (modalType === 'motionCapture') {
                setIsMotionCaptureOpen(false);
            } else if (modalType === 'internationalTrade') {
                setIsInternationalTradeOpen(false);
            }
            setIsClosing(false);
        }, 1500);
    };

    const commands = {

        Research: {
            description: 'You are here',
            fn: function () {
                return 'You are already at the Research page';
            }
        },

        ls: {
            description: 'List all projects on the page',
            fn: function () {
                return 'UrbanCPS\nFreeMoCap\nInternationalTradeProject';
            }
        },
        about: {
            description: 'Go to About page',
            fn: function () {
                navigate('/about');
                return 'Redirecting to About page...';
            }
        },

        projects: {
            description: 'Go to Projects page',
            fn: function () {
                setTimeout(function () {
                    navigate('/projects');
                }, 1200);
                return 'Redirecting to the projects Page ...';
            }
        },

        misc: {
            description: 'Go to Misc page',
            fn: function () {
                setTimeout(function () {
                    navigate('/misc');
                }, 1200);
                return 'Redirecting to the Miscellaneous Page ...';
            }
        },

        cd: {
            description: 'Go to Main page',
            fn: function () {
                setTimeout(function () {
                    navigate('/');
                }, 1200);
                return 'Redirecting to the Main Page ...';
            }
        },

        UrbanCPS: {
            description: 'Research Project for Cyber Physical Systems Lab',
            fn: function () {
                setTimeout(function () {
                    setIsCPSOpen(true);
                }, 1200);
                return "You're gonna be astonished by this one...";
            }
        },

        FreeMoCap: {
            description: 'Research Project for Cognitive Dynamics Lab',
            fn: function () {
                setTimeout(function () {
                    setIsMotionCaptureOpen(true);
                }, 1200);
                return 'Cool Motion Capture stuff coming right up...';
            }
        },

        InternationalTradeProject: {
            description: 'Research Project for School of Business',
            fn: function () {
                setTimeout(function () {
                    setIsInternationalTradeOpen(true);
                }, 1200);
                return 'Excelsior...';
            }
        }
    };

    return (
        <Layout commands={commands} welcomeMessage="Enter command 'ls' to see some cool stuff done with professors. Use 'cd' to go back to the main page.">
            {isCPSOpen && !isAnimatingClose && !isClosing && (
                <CPSModal isOpen={isCPSOpen} onClose={() => closeModal('cps')} />
            )}
            {isMotionCaptureOpen && !isAnimatingClose && !isClosing && (
                <FreeMoCapModal isOpen={isMotionCaptureOpen} onClose={() => closeModal('motionCapture')} />
            )}
            {isInternationalTradeOpen && !isAnimatingClose && !isClosing && (
                <InternationalTradeModal isOpen={isInternationalTradeOpen} onClose={() => closeModal('internationalTrade')} />
            )}
        </Layout>
    );
};

export default Research;
