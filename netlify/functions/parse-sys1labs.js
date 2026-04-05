const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { fileBase64 } = JSON.parse(event.body);
    if (!fileBase64) throw new Error('未收到文件内容');

    const fileBuffer = Buffer.from(fileBase64, 'base64');
    const pdfData = await pdfParse(fileBuffer);
    const text = pdfData.text;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
请从以下教学大纲中提取课程信息：
- 课程名称
- 课程编号
- 开课学期
- 课程性质（必修/选修）
- 学分（数字）
- 课内学时（数字）
- 考核方式（考试/考查）
- 课程目标描述（字符串数组）

请以 JSON 格式返回，字段名称为：
courseName, courseId, semester, courseNature, credits, classHours, examType, objectiveDescriptions

大纲内容：
${text.substring(0, 20000)}
`;

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();

    let jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const parsedData = JSON.parse(jsonStr);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data: parsedData })
    };
  } catch (error) {
    console.error('解析失败:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
