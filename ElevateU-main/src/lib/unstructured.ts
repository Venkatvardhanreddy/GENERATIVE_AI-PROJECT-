/**
 * Unstructured.io Service
 * Used for high-fidelity PDF parsing and data extraction.
 */

const UNSTRUCTURED_API_URL = 'https://api.unstructured.io/general/v0/general';
const API_KEY = import.meta.env.VITE_UNSTRUCTURED_API_KEY || 'FeIEHnMsUGiHmPeDMm4kmLoUakJtcS';

export interface UnstructuredElement {
  type: string;
  text: string;
  metadata: {
    page_number?: number;
    filename?: string;
    filetype?: string;
  };
}

export async function parseResumeWithUnstructured(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('strategy', 'hi_res'); // Use high-res for better accuracy with resumes

  try {
    const response = await fetch(UNSTRUCTURED_API_URL, {
      method: 'POST',
      headers: {
        'unstructured-api-key': API_KEY,
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Extraction service error: ${response.status}`);
    }

    const elements: UnstructuredElement[] = await response.json();
    
    // Combine all text elements into a single string
    // We filter for meaningful content types
    const parsedText = elements
      .map(el => el.text)
      .join('\n');

    return parsedText;
  } catch (error) {
    console.error('Error parsing resume during extraction:', error);
    throw error;
  }
}
