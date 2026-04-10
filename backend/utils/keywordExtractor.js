/**
 * Keyword Extractor Utility
 * Analyzes post text to identify significant keywords for trend analysis.
 * Filters out common stop-words in Vietnamese and English.
 */

const STOP_WORDS = new Set([
    // Vietnamese common words
    "là", "và", "của", "thì", "mà", "có", "cho", "được", "trong", "với", "như", "này", "cái", "một", "những",
    "vào", "ra", "lên", "xuống", "đến", "đi", "về", "lại", "vẫn", "cũng", "còn", "đang", "đã", "sẽ", "phải",
    "hay", "cơ", "nữa", "nhé", "nha", "đó", "nọ", "kia", "tại", "vì", "nên", "nhưng", "tuy", "rồi", "mới",
    "chung", "riêng", "mình", "chúng", "tôi", "bạn", "người", "họ", "anh", "chị", "em", "ông", "bà", "con",
    "ở", "từ", "qua", "theo", "trên", "dưới", "giữa", "bên", "ngoài", "phía", "trước", "sau", "đầu",
    "nếu", "nhỉ", "như", "nào", "biết", "thích", "muốn", "làm", "được", "nghĩ", "thấy", "cho", "để", "lại",
    "rất", "quá", "lắm", "nhiều", "ít", "gần", "xa", "nay", "mai", "giờ", "lúc", "ngày", "đêm", "sáng", "chiều",
    "mỗi", "từng", "hết", "cả", "chỉ", "vừa", "mới", "đều", "luôn", "vừa", "cùng", "nhau", "cần", "nên",

    // English common words
    "the", "and", "a", "an", "is", "of", "to", "in", "it", "with", "for", "on", "at", "by", "from", "up",
    "down", "out", "about", "into", "over", "after", "then", "also", "some", "any", "been", "was", "were",
    "will", "can", "must", "should", "not", "this", "that", "these", "those", "have", "doing", "get"
]);

export const extractKeywords = (text) => {
    if (!text) return [];

    // Remove emojis, special characters, and numbers
    // Note: We keep '#' if we want to treat hashtags as keywords too, 
    // but the controller handles hashtags separately.
    const cleanText = text
        .toLowerCase()
        .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const words = cleanText.split(" ");
    
    // Filter logic:
    // 1. Length > 2 (ignore short words like 'if', 'do', 'đi')
    // 2. Not in stop-words list
    // 3. Not a pure number
    const keywords = words.filter(word => {
        return (
            word.length > 2 && 
            !STOP_WORDS.has(word) && 
            isNaN(word)
        );
    });

    // Return unique keywords
    return [...new Set(keywords)];
};
