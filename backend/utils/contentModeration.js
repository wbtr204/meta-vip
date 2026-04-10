const REASON_LABELS = {
	toxic_language: "Ngôn từ xúc phạm",
	hate_speech: "Ngôn từ thù ghét",
	personal_attack: "Công kích cá nhân",
	scam_terms: "Dấu hiệu lừa đảo",
	spam_promo: "Spam quảng cáo",
	too_many_links: "Quá nhiều liên kết",
	excessive_hashtags: "Quá nhiều hashtag",
	excessive_mentions: "Quá nhiều đề cập",
	repeated_chars: "Ký tự lặp bất thường",
	excessive_caps: "Viết hoa bất thường",
	repeated_words: "Nội dung lặp lại",
};

const TOXIC_PATTERNS = [
	{ regex: /\b(dcm|dm|dit me|dit con me|dit cu|lon|buoi)\b/i, reason: "toxic_language" },
	{ regex: /\b(fuck|shit|bitch|asshole|motherfucker|mf)\b/i, reason: "toxic_language" },
	{ regex: /(?:ngu|oc cho|khon nan|do cho|cut di|cam mom)/i, reason: "personal_attack" },
	{ regex: /(?:racist|nazi|kill yourself|go die)/i, reason: "hate_speech" },
];

const SPAM_PATTERNS = [
	{ regex: /(?:dang ky ngay|click ngay|mua ngay|inbox ngay|follow cheo|buff follow|tang tuong tac|kiem tien nhanh|chot don|san sale)/i, reason: "spam_promo" },
	{ regex: /(?:mien phi tien|free tien|giveaway|airdrop|100% loi|dau tu chac thang|loi nhuan cao)/i, reason: "scam_terms" },
	{ regex: /(?:telegram|whatsapp|zalo|facebook\.com\/share|bit\.ly|tinyurl|t\.me|discord\.gg)/i, reason: "spam_promo" },
];

const normalizeText = (text) =>
	text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/đ/g, "d")
		.replace(/Đ/g, "D")
		.toLowerCase();

const countMatches = (text, pattern) => (text.match(pattern) || []).length;

const uniqueReasons = (reasons) => [...new Set(reasons)];

export const formatModerationReasons = (reasons = []) =>
	uniqueReasons(reasons).map((reason) => REASON_LABELS[reason] || reason);

export const moderateContent = (rawText = "") => {
	const text = String(rawText || "").trim();
	if (!text) {
		return { blocked: false, flagged: false, reasons: [], score: 0 };
	}

	const normalized = normalizeText(text);
	const blockedReasons = [];
	const flaggedReasons = [];

	for (const rule of TOXIC_PATTERNS) {
		if (rule.regex.test(text) || rule.regex.test(normalized)) {
			blockedReasons.push(rule.reason);
		}
	}

	for (const rule of SPAM_PATTERNS) {
		if (rule.regex.test(text) || rule.regex.test(normalized)) {
			blockedReasons.push(rule.reason);
		}
	}

	const urlCount = countMatches(normalized, /https?:\/\/\S+|www\.\S+/g);
	if (urlCount >= 2) {
		blockedReasons.push("too_many_links");
	}

	const hashtagCount = countMatches(text, /#\w+/g);
	if (hashtagCount >= 8) {
		flaggedReasons.push("excessive_hashtags");
	}

	const mentionCount = countMatches(text, /@\w+/g);
	if (mentionCount >= 8) {
		flaggedReasons.push("excessive_mentions");
	}

	if (/(.)\1{5,}/.test(text)) {
		flaggedReasons.push("repeated_chars");
	}

	const lettersOnly = text.replace(/[^A-Za-zÀ-ỹĐđ]/g, "");
	if (lettersOnly.length > 20) {
		const upperCount = (lettersOnly.match(/[A-ZÀ-ỸĐ]/g) || []).length;
		const upperRatio = upperCount / lettersOnly.length;
		if (upperRatio >= 0.7) {
			flaggedReasons.push("excessive_caps");
		}
	}

	const words = normalized.split(/\s+/).filter(Boolean);
	if (words.length >= 12) {
		const uniqueRatio = new Set(words).size / words.length;
		if (uniqueRatio <= 0.5) {
			flaggedReasons.push("repeated_words");
		}
	}

	const blocked = uniqueReasons(blockedReasons).length > 0;
	const flagged = !blocked && uniqueReasons(flaggedReasons).length > 0;
	const reasons = uniqueReasons([...blockedReasons, ...flaggedReasons]);
	const score = uniqueReasons(blockedReasons).length * 3 + uniqueReasons(flaggedReasons).length;

	return {
		blocked,
		flagged,
		reasons,
		score,
	};
};
