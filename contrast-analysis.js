#!/usr/bin/env node

// Dark Theme Color Contrast Analysis
console.log('='.repeat(60));
console.log('TauLeChat Dark Theme Color Contrast Analysis');
console.log('='.repeat(60));

// Dark theme color variables
const darkThemeColors = {
    'background': '#181825',
    'foreground': '#cdd6f4',
    'card': '#1e1e2e',
    'card-foreground': '#cdd6f4',
    'popover': '#45475a',
    'popover-foreground': '#cdd6f4',
    'primary': '#cba6f7',
    'primary-foreground': '#1e1e2e',
    'secondary': '#585b70',
    'secondary-foreground': '#cdd6f4',
    'muted': '#292c3c',
    'muted-foreground': '#a6adc8',
    'accent': '#b4a1fa',
    'accent-foreground': '#1e1e2e',
    'destructive': '#f38ba8',
    'destructive-foreground': '#1e1e2e',
    'border': '#313244',
    'input': '#313244',
    'ring': '#cba6f7',
    'sidebar': '#11111b',
    'sidebar-foreground': '#cdd6f4',
    'sidebar-primary': '#cba6f7',
    'sidebar-primary-foreground': '#1e1e2e',
    'sidebar-accent': '#89dceb',
    'sidebar-accent-foreground': '#1e1e2e',
    'sidebar-border': '#45475a'
};

// Convert hex/rgb to RGB values
function parseColor(color) {
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16)
        };
    } else if (color.startsWith('rgb')) {
        const values = color.match(/\d+/g);
        return {
            r: parseInt(values[0]),
            g: parseInt(values[1]),
            b: parseInt(values[2])
        };
    }
    return null;
}

// Calculate relative luminance
function getLuminance(color) {
    const rgb = parseColor(color);
    if (!rgb) return 0;

    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Calculate contrast ratio
function getContrastRatio(color1, color2) {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
}

// Test color combinations
const colorCombinations = [
    { bg: 'background', fg: 'foreground', context: 'Main background text' },
    { bg: 'card', fg: 'card-foreground', context: 'Card text' },
    { bg: 'popover', fg: 'popover-foreground', context: 'Popover text' },
    { bg: 'primary', fg: 'primary-foreground', context: 'Primary button text' },
    { bg: 'secondary', fg: 'secondary-foreground', context: 'Secondary button text' },
    { bg: 'muted', fg: 'muted-foreground', context: 'Muted text' },
    { bg: 'accent', fg: 'accent-foreground', context: 'Accent button text' },
    { bg: 'destructive', fg: 'destructive-foreground', context: 'Destructive button text' },
    { bg: 'sidebar', fg: 'sidebar-foreground', context: 'Sidebar text' },
    { bg: 'sidebar-primary', fg: 'sidebar-primary-foreground', context: 'Sidebar primary button text' },
    { bg: 'sidebar-accent', fg: 'sidebar-accent-foreground', context: 'Sidebar accent button text' },
    { bg: 'background', fg: 'muted-foreground', context: 'Muted text on background' },
    { bg: 'card', fg: 'muted-foreground', context: 'Muted text on card' },
    { bg: 'input', fg: 'foreground', context: 'Input text' },
];

console.log('\nColor Contrast Test Results:\n');
console.log('WCAG Guidelines:');
console.log('- AA Normal Text: 4.5:1 minimum');
console.log('- AA Large Text: 3.0:1 minimum');
console.log('- AAA Normal Text: 7.0:1 minimum\n');

const failingCombos = [];
const warningCombos = [];

colorCombinations.forEach(combo => {
    const bgColor = darkThemeColors[combo.bg];
    const fgColor = darkThemeColors[combo.fg];

    if (!bgColor || !fgColor) {
        console.log(`❌ MISSING: ${combo.context} - Missing color definition`);
        failingCombos.push(combo);
        return;
    }

    const ratio = getContrastRatio(bgColor, fgColor);
    const isAANormal = ratio >= 4.5;
    const isAALarge = ratio >= 3.0;
    const isAAANormal = ratio >= 7.0;

    let status, icon;
    if (isAAANormal) {
        status = 'AAA Normal (Excellent)';
        icon = '✅';
    } else if (isAANormal) {
        status = 'AA Normal (Good)';
        icon = '✅';
    } else if (isAALarge) {
        status = 'AA Large Text Only';
        icon = '⚠️';
        warningCombos.push({ ...combo, ratio });
    } else {
        status = 'Fails WCAG Guidelines';
        icon = '❌';
        failingCombos.push({ ...combo, ratio });
    }

    console.log(`${icon} ${combo.context}`);
    console.log(`   ${combo.bg} (${bgColor}) → ${combo.fg} (${fgColor})`);
    console.log(`   Contrast: ${ratio.toFixed(2)}:1 - ${status}\n`);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));

console.log(`\nTotal combinations tested: ${colorCombinations.length}`);
console.log(`✅ Passing: ${colorCombinations.length - failingCombos.length - warningCombos.length}`);
console.log(`⚠️  Warnings (Large text only): ${warningCombos.length}`);
console.log(`❌ Failing: ${failingCombos.length}`);

if (failingCombos.length > 0) {
    console.log('\n⚠️  CRITICAL ISSUES FOUND:');
    failingCombos.forEach(combo => {
        const bgColor = darkThemeColors[combo.bg];
        const fgColor = darkThemeColors[combo.fg];
        const ratio = combo.ratio || (bgColor && fgColor ? getContrastRatio(bgColor, fgColor) : 0);
        console.log(`   • ${combo.context}: ${ratio ? ratio.toFixed(2) : 'N/A'}:1`);
    });
}

if (warningCombos.length > 0) {
    console.log('\n⚠️  WARNINGS (Use for large text only):');
    warningCombos.forEach(combo => {
        console.log(`   • ${combo.context}: ${combo.ratio.toFixed(2)}:1`);
    });
}

console.log('\n' + '='.repeat(60));
