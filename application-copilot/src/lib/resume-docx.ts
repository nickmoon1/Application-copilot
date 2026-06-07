const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const documentRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:sz w:val="20"/>
    </w:rPr>
  </w:style>
</w:styles>`;

type Paragraph = {
  bold?: boolean;
  text: string;
  type: "bullet" | "heading" | "normal" | "title";
};

export function generateResumeDocx(markdown: string) {
  const paragraphs = parseResumeMarkdown(markdown);
  const documentXml = buildDocumentXml(paragraphs);

  return zipStore([
    { path: "[Content_Types].xml", content: Buffer.from(contentTypesXml) },
    { path: "_rels/.rels", content: Buffer.from(rootRelsXml) },
    { path: "word/_rels/document.xml.rels", content: Buffer.from(documentRelsXml) },
    { path: "word/styles.xml", content: Buffer.from(stylesXml) },
    { path: "word/document.xml", content: Buffer.from(documentXml) },
  ]);
}

function parseResumeMarkdown(markdown: string) {
  const resumeOnly = markdown.split("\n## REVIEW NOTES")[0] ?? markdown;
  const paragraphs: Paragraph[] = [];

  for (const rawLine of resumeOnly.split("\n")) {
    const line = rawLine.trim();

    if (!line) continue;
    if (line.startsWith("# ")) continue;

    if (line.startsWith("## ")) {
      const text = line.replace(/^##\s+/, "").trim();
      paragraphs.push({
        bold: true,
        text,
        type: text === text.toUpperCase() ? "title" : "heading",
      });
      continue;
    }

    if (line.startsWith("### ")) {
      paragraphs.push({
        bold: true,
        text: line.replace(/^###\s+/, "").trim(),
        type: "heading",
      });
      continue;
    }

    if (line.startsWith("- ")) {
      paragraphs.push({
        text: line.replace(/^-\s+/, "").trim(),
        type: "bullet",
      });
      continue;
    }

    paragraphs.push({
      bold: line.startsWith("**") && line.endsWith("**"),
      text: line.replace(/^\*\*/, "").replace(/\*\*$/, "").trim(),
      type: "normal",
    });
  }

  return paragraphs;
}

function buildDocumentXml(paragraphs: Paragraph[]) {
  const body = paragraphs.map(buildParagraphXml).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function buildParagraphXml(paragraph: Paragraph) {
  const spacing = paragraph.type === "title" ? "120" : paragraph.type === "heading" ? "80" : "20";
  const bold = paragraph.bold || paragraph.type === "title" || paragraph.type === "heading";
  const size = paragraph.type === "title" ? "24" : "20";
  const indent = paragraph.type === "bullet" ? '<w:ind w:left="360" w:hanging="180"/>' : "";
  const bulletPrefix = paragraph.type === "bullet" ? "• " : "";

  return `<w:p>
  <w:pPr><w:spacing w:before="${spacing}" w:after="20"/>${indent}</w:pPr>
  <w:r>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="${size}"/>${bold ? "<w:b/>" : ""}</w:rPr>
    <w:t xml:space="preserve">${escapeXml(bulletPrefix + paragraph.text)}</w:t>
  </w:r>
</w:p>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type ZipFile = {
  content: Buffer;
  path: string;
};

function zipStore(files: ZipFile[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.path);
    const crc = crc32(file.content);
    const localHeader = Buffer.alloc(30);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(file.content.length, 18);
    localHeader.writeUInt32LE(file.content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, name, file.content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(file.content.length, 20);
    centralHeader.writeUInt32LE(file.content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + file.content.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localFiles = Buffer.concat(localParts);
  const end = Buffer.alloc(22);

  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localFiles.length, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([localFiles, centralDirectory, end]);
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
