"use client";

import styles from "./navbar.module.scss";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import polls from "../json_files/polls.json";

const predLinks = polls.people
    ? polls.people.map(person => [person, `/ai-predictions/${person}`])
    : [];

const farmAdventureLinks = polls.people
    ? polls.people.map(person => [person, `/farm-adventures/${person}`])
    : [];


const links = [
    ["🏠 Home", "/"],
    ["🏅 Awards", "/awards"],
    ["🐮 Farm Adventures", "/farm-adventures", farmAdventureLinks],
    ["🤖 AI Predictions", "/ai-predictions", predLinks],
];

// Load "Inter" font
const inter = Inter({ subsets: ["latin"] });

export default function Navbar() {
    const [menuActive, setMenuActive] = useState(false);
    const [expandedSubmenu, setExpandedSubmenu] = useState(null);
    const navRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    const handleLoadingChange = (loading) => {
        setIsLoading(loading);
    };

    const handleScroll = () => {
        const body = document.body;
        const html = document.documentElement;
        if (menuActive) {
            window.scrollTo(0, 0);
            body.style.overflow = "hidden";
            html.style.overflow = "hidden";
        } else {
            body.style.overflow = "auto";
            html.style.overflow = "auto";
        }
    };

    useEffect(() => {
        handleScroll();

        const handleClickOutside = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setMenuActive(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [menuActive]);
    
    const handleLinkClick = (event) => {
        if (event.target.tagName === 'A') { // Check if the clicked element is a <Link>
            setMenuActive(false);
        }
    };

    const toggleMenu = () => {
        setMenuActive(!menuActive);
        setExpandedSubmenu(null);
    };

    const toggleSubmenu = (index) => {
        setExpandedSubmenu(expandedSubmenu === index ? null : index);
    };

    return (
        <nav className={styles.navbar} ref={navRef}>
            <div className={styles.navbarBody}>
                <div className={styles.logoContainer}>
                    {/* <Link href="/">
                        <Image
                            className={styles.logoImg}
                            src={Logo}
                            alt="logo"
                        />
                    </Link> */}
                </div>

                <ul onClick={handleLinkClick} className={`${styles.navbarLinks} ${menuActive ? styles.active : ''}`}>
                    {links.map(([titleName, titleRoute, dropdownItems], index) => (
                        dropdownItems === undefined ? (
                            <li key={titleRoute}>
                                <Link href={titleRoute}>{titleName}</Link>
                            </li>
                        ) : (
                            <li 
                                key={titleRoute} 
                                className={styles.dropdown}
                            >
                                <div 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSubmenu(index);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                >
                                    <Link href={titleRoute}>{titleName}</Link>
                                    <span className={`${styles.dropdownToggle} ${expandedSubmenu === index ? styles.active : ''}`}>
                                        ▼
                                    </span>
                                </div>
                                <ul className={`${styles.dropdownContent} ${titleName === "🤖 AI Predictions" ? styles["ai-pred"] : ''} ${expandedSubmenu === index ? styles.show : ''}`}>
                                    {dropdownItems.map(([itemName, itemRoute]) => {
                                        console.log("Rendering dropdown item:", itemName, itemRoute);
                                        return (
                                            <li key={itemRoute}>
                                                <Link href={itemRoute}>{itemName}</Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>
                        )
                    ))}
                </ul>

                {/* Hamburger Menu for mobile */}
                <div onClick={toggleMenu} className={`${styles.toggleButton} ${menuActive ? styles.active : ""}`}>
                    <div />
                    <div />
                    <div />
                </div>
            </div>
        </nav>
    );
}