import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

const PDF_MARGIN_MM = 8;
const PDF_SECONDARY_RGB = [69, 63, 60];
const PDF_CAPTURE_WIDTH_PX = 820;
const PDF_PANEL_CLASS =
    'bg-base-200 border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-6';

function addResultsPageHeader(pdf, propertyAddress) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const maxWidth = pageWidth - PDF_MARGIN_MM * 2;
    const title = `Results for ${propertyAddress || 'your property'}`;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(...PDF_SECONDARY_RGB);

    const lines = pdf.splitTextToSize(title, maxWidth);
    const lineHeight = 7;
    const startY = PDF_MARGIN_MM + 4;

    pdf.text(lines, PDF_MARGIN_MM, startY);

    const headerBottom = startY + lines.length * lineHeight + 3;

    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.3);
    pdf.line(PDF_MARGIN_MM, headerBottom, pageWidth - PDF_MARGIN_MM, headerBottom);

    return headerBottom + 4;
}

function addPageNumbers(pdf) {
    const pageCount = pdf.internal.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let page = 1; page <= pageCount; page += 1) {
        pdf.setPage(page);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(156, 163, 175);

        const label = `Page ${page} of ${pageCount}`;
        const labelWidth = pdf.getTextWidth(label);
        pdf.text(label, pageWidth - PDF_MARGIN_MM - labelWidth, pageHeight - PDF_MARGIN_MM + 2);
    }
}

function stripReferenceCardActionButtons(root) {
    root.querySelectorAll('button').forEach((button) => {
        const label = button.textContent?.trim().toLowerCase() ?? '';
        if (label === 'edit' || label === 'add loan' || label === 'pay in cash') {
            button.remove();
        }
    });
}

function stripPdfExcludedElements(root) {
    root.querySelectorAll('[data-pdf-exclude]').forEach((el) => el.remove());
}

const INLINE_COLOR_PROPERTIES = [
    'color',
    'backgroundColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'textDecorationColor',
    'columnRuleColor',
    'caretColor',
];

function normalizeColorsForCapture(sourceRoot, cloneRoot) {
    const sourceNodes = [sourceRoot, ...sourceRoot.querySelectorAll('*')];
    const cloneNodes = [cloneRoot, ...cloneRoot.querySelectorAll('*')];

    sourceNodes.forEach((source, index) => {
        const clone = cloneNodes[index];
        if (!(clone instanceof HTMLElement) || !(source instanceof Element)) return;

        const computed = window.getComputedStyle(source);

        INLINE_COLOR_PROPERTIES.forEach((prop) => {
            const value = computed[prop];
            if (value) {
                clone.style[prop] = value;
            }
        });

        const boxShadow = computed.boxShadow;
        if (boxShadow && boxShadow !== 'none') {
            clone.style.boxShadow = boxShadow;
        }

        const backgroundImage = computed.backgroundImage;
        if (backgroundImage && backgroundImage !== 'none') {
            clone.style.backgroundImage = backgroundImage;
        }
    });
}

function prepareCloneForCapture(sourceRoot, clonedElement) {
    clonedElement.querySelectorAll('*').forEach((el) => {
        if (!(el instanceof HTMLElement)) return;

        const style = window.getComputedStyle(el);
        if (style.overflow === 'hidden' || style.overflowY === 'hidden') {
            el.style.overflow = 'visible';
        }
        if (style.maxHeight && style.maxHeight !== 'none') {
            el.style.maxHeight = 'none';
        }
    });

    normalizeColorsForCapture(sourceRoot, clonedElement);
}

async function captureElement(element) {
    if (!element) {
        throw new Error('Missing element to capture');
    }

    return html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fafafa',
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.scrollWidth,
        onclone: (_doc, clonedElement) => {
            prepareCloneForCapture(element, clonedElement);
        },
    });
}

function createOffScreenHost({ minHeight, flexColumn = false }) {
    const host = document.createElement('div');
    host.className = PDF_PANEL_CLASS;
    const styles = [
        'position:fixed',
        'left:-10000px',
        'top:0',
        `width:${PDF_CAPTURE_WIDTH_PX}px`,
        'z-index:-1',
    ];
    if (minHeight != null) {
        styles.push(`min-height:${minHeight}px`);
    }
    if (flexColumn) {
        styles.push('display:flex', 'flex-direction:column');
    }
    host.style.cssText = styles.join(';');
    return host;
}

async function captureReferenceCardsGrid(cardEls) {
    const host = createOffScreenHost({ minHeight: null });

    const grid = document.createElement('div');
    grid.style.cssText = [
        'display:grid',
        'grid-template-columns:repeat(2,minmax(0,1fr))',
        'gap:16px',
        'align-items:stretch',
    ].join(';');

    cardEls.forEach((el) => {
        const cell = document.createElement('div');
        cell.style.cssText = 'display:flex;align-items:stretch;min-width:0;min-height:0;';

        const clone = el.cloneNode(true);
        if (clone instanceof HTMLElement) {
            stripReferenceCardActionButtons(clone);
            stripPdfExcludedElements(clone);
            clone.style.flex = '1 1 auto';
            clone.style.width = '100%';
            clone.style.height = '100%';
            clone.style.minHeight = '100%';
            clone.style.alignSelf = 'stretch';
        }

        cell.appendChild(clone);
        grid.appendChild(cell);
    });

    host.appendChild(grid);
    document.body.appendChild(host);

    try {
        const cells = [...grid.children];
        if (cells.length === 4) {
            const row1Height = Math.max(cells[0].offsetHeight, cells[1].offsetHeight);
            const row2Height = Math.max(cells[2].offsetHeight, cells[3].offsetHeight);
            cells[0].style.minHeight = `${row1Height}px`;
            cells[1].style.minHeight = `${row1Height}px`;
            cells[2].style.minHeight = `${row2Height}px`;
            cells[3].style.minHeight = `${row2Height}px`;
        }

        return await captureElement(host);
    } finally {
        host.remove();
    }
}

async function captureStyledPanel(contentEl, { stretchContent = false, minHeight = 900 } = {}) {
    const host = createOffScreenHost({ minHeight, flexColumn: stretchContent });

    const clone = contentEl.cloneNode(true);
    if (clone instanceof HTMLElement) {
        stripPdfExcludedElements(clone);
        if (stretchContent) {
            clone.style.flex = '1 1 auto';
            clone.style.width = '100%';
            clone.style.minHeight = '100%';
        }
    }

    host.appendChild(clone);
    document.body.appendChild(host);

    try {
        return await captureElement(host);
    } finally {
        host.remove();
    }
}

function fitCanvasInBox(canvas, boxWidth, boxHeight) {
    let imgWidth = boxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > boxHeight) {
        imgHeight = boxHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    return { imgWidth, imgHeight };
}

function addCanvasToPdfPage(pdf, canvas, { isFirstPage = false, contentTop = PDF_MARGIN_MM } = {}) {
    if (!isFirstPage) {
        pdf.addPage();
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const availableWidth = pageWidth - PDF_MARGIN_MM * 2;
    const availableHeight = pageHeight - contentTop - PDF_MARGIN_MM;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const { imgWidth, imgHeight } = fitCanvasInBox(canvas, availableWidth, availableHeight);

    const x = PDF_MARGIN_MM + (availableWidth - imgWidth) / 2;
    pdf.addImage(imgData, 'JPEG', x, contentTop, imgWidth, imgHeight);
}

/**
 * Builds the three-page results PDF document.
 */
export async function buildResultsPdf({
    costsColumnEl,
    grantsCardEl,
    referenceCardEls,
    propertyAddress,
}) {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

    const contentTop = addResultsPageHeader(pdf, propertyAddress);

    const costsCanvas = await captureStyledPanel(costsColumnEl);
    addCanvasToPdfPage(pdf, costsCanvas, { isFirstPage: true, contentTop });

    const grantsCanvas = await captureStyledPanel(grantsCardEl, { minHeight: null });
    pdf.addPage();
    const grantsContentTop = addResultsPageHeader(pdf, propertyAddress);
    addCanvasToPdfPage(pdf, grantsCanvas, { isFirstPage: true, contentTop: grantsContentTop });

    const referenceCardsCanvas = await captureReferenceCardsGrid(referenceCardEls);
    pdf.addPage();
    const referenceContentTop = addResultsPageHeader(pdf, propertyAddress);
    addCanvasToPdfPage(pdf, referenceCardsCanvas, { isFirstPage: true, contentTop: referenceContentTop });

    addPageNumbers(pdf);

    return pdf;
}

export function getResultsPdfFilename(propertyAddress) {
    const addressSlug = (propertyAddress || 'property')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()
        .slice(0, 40);

    return `property-results-${addressSlug || 'summary'}.pdf`;
}

export function resultsPdfToBlob(pdf) {
    return pdf.output('blob');
}

export function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== 'string') {
                reject(new Error('Failed to encode PDF'));
                return;
            }
            resolve(result.split(',')[1]);
        };
        reader.onerror = () => reject(reader.error ?? new Error('Failed to encode PDF'));
        reader.readAsDataURL(blob);
    });
}

export async function downloadResultsPdf(params) {
    const pdf = await buildResultsPdf(params);
    pdf.save(getResultsPdfFilename(params.propertyAddress));
}

/** @deprecated Use buildResultsPdf + downloadResultsPdf */
export async function generateResultsPdf(params) {
    await downloadResultsPdf(params);
}

export const PDF_CAPTURE_DELAY_MS = 450;
