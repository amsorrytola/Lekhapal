/**
 * @fileoverview This file contains detailed and generalized prompts for various document types.
 * Each prompt is designed to instruct the Gemini model to extract information and format it
 * into a predictable JSON structure, handling variations in column headers and layout.
 */

/**
 * Returns a highly detailed prompt based on the document type.
 * @param documentType The type of the document.
 * @returns A detailed prompt string for the Gemini model.
 */
export function getPrompt(documentType: string): string {
  const genericTablePrompt = `You are an OCR engine that extracts **all tables** from a scanned document.
Return a STRICT JSON array of objects. Do not include any markdown formatting (e.g., \`\`\`json).

Output format:
[
  {
    "title": "string (the heading above the table, or a descriptive title based on context)",
    "columns": ["col1", "col2", ...],
    "rows": [
      ["row1col1", "row1col2", ...],
      ["row2col1", "row2col2", ...]
    ]
  },
  ...
]

⚠️ Extraction Rules:
- Identify each visible rectangular grid or distinct tabular section as a separate table.
- Use the heading above the table as the "title" (e.g., "SHG Loan Repayment"). If no heading, create a descriptive title (e.g., "Member Loan Details for [Member Name]").
- The "columns" array must contain the exact column headers as they appear in the table.
- The "rows" array must contain a nested array for each row, where each cell value is a string.
- Preserve all Hindi text and characters **exactly** as written (don’t translate).
- Keep numbers plain (e.g., 60090, not "60,090").
- If a cell is blank or the value is missing, use an empty string "" to pad the row.
- Ensure the number of elements in each row matches the number of columns.
- Only return the JSON array. No explanations, no extra text.`;

  switch (documentType) {
    case 'SHG Profile':
      return `You are a document parser specializing in SHG profile documents. Extract all key-value data into a single JSON object.
Return a STRICT JSON object only. Do not include any markdown formatting (e.g., \`\`\`json).

Expected JSON Structure:
{
  "shgProfile": {
    "shgName": "string",
    "dateOfFormation": "string (in DD/MM/YY or DD/MM/YYYY format)",
    "meetingFrequency": "string",
    "villageName": "string",
    "gramPanchayatName": "string",
    "nameOfVo": "string",
    "nameOfClf": "string",
    "blockName": "string",
    "districtName": "string",
    "joiningDateInVo": "string (in DD/MM/YY or DD/MM/YYYY format)"
  }
}

Extraction Rules:
- The keys in the JSON must match the \`shgProfile\` object keys exactly.
- Extract the value corresponding to each label (e.g., "NAME OF SHG") and assign it to the correct key.
- If a value is split across multiple lines, concatenate it into a single string.
- Preserve Hindi text and numbers exactly as they appear in the image.
- Handle edge cases where a field might be missing; if a value is not present, use an empty string "" for its value.
- Do not extract any other tables or information, only the main SHG Profile section.
- Only return the JSON object. No explanations, no extra text.`;

    case 'Receipts by SHG':
    case 'Expenditure by SHG':
    case 'Savings':
    case 'Loan Taken & Repayment by SHG':
      return genericTablePrompt;

    case 'Loan Taken & Repayment by Members':
      return `You are an OCR engine that extracts **all member-specific loan tables** from a scanned document.
Return a STRICT JSON array of objects. Do not include any markdown formatting (e.g., \`\`\`json).

Output format:
[
  {
    "title": "string (the member's name)",
    "columns": ["col1", "col2", ...],
    "rows": [
      ["row1col1", "row1col2", ...],
      ["row2col1", "row2col2", ...]
    ]
  },
  ...
]

⚠️ Extraction Rules:
- [cite_start]Each member's loan record section (e.g., "Meमूना बाबू पटेल" or "Lalita") is a separate table. [cite: 377, 493, 494]
- [cite_start]Use the member's name as the "title" for each table object. [cite: 371, 377, 483, 488, 493]
- The "columns" array must contain the exact column headers from each member's table.
- The "rows" array must contain a nested array for each row, with values as strings.
- Preserve all Hindi text and characters **exactly** as written.
- Keep numbers plain.
- If a cell is blank or the value is missing, use an empty string "" to pad the row.
- Ensure the number of elements in each row matches the number of columns.
- Only return the JSON array. No explanations, no extra text.`;

    case 'Others':
      return genericTablePrompt;

    default:
      return genericTablePrompt;
  }
}