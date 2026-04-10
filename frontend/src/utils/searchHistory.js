const LEGACY_HISTORY_KEY = "vibenet_search_history";
const HISTORY_MIGRATION_CUTOFF = new Date("2026-04-03T00:00:00.000Z");

const getUserContext = (userOrId) => {
	if (!userOrId) return { userId: null, createdAt: null };

	if (typeof userOrId === "object") {
		return {
			userId: userOrId._id || null,
			createdAt: userOrId.createdAt || null,
		};
	}

	return { userId: userOrId, createdAt: null };
};

const shouldFallBackToLegacyHistory = (createdAt) => {
	if (!createdAt) return false;

	const userCreatedAt = new Date(createdAt);
	return !Number.isNaN(userCreatedAt.getTime()) && userCreatedAt < HISTORY_MIGRATION_CUTOFF;
};

export const getSearchHistoryKey = (userOrId) => {
	const { userId } = getUserContext(userOrId);
	return userId ? `vibenet_search_history:${userId}` : null;
};

export const loadSearchHistory = (userOrId) => {
	const { userId, createdAt } = getUserContext(userOrId);
	if (!userId) return [];

	const key = getSearchHistoryKey(userId);
	const savedHistory = localStorage.getItem(key);
	if (savedHistory) {
		try {
			const parsed = JSON.parse(savedHistory);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	if (!shouldFallBackToLegacyHistory(createdAt)) return [];

	const legacyHistory = localStorage.getItem(LEGACY_HISTORY_KEY);
	if (!legacyHistory) return [];

	try {
		const parsed = JSON.parse(legacyHistory);
		const history = Array.isArray(parsed) ? parsed : [];
		localStorage.setItem(key, JSON.stringify(history));
		return history;
	} catch {
		return [];
	}
};

export const saveSearchHistory = (userOrId, history) => {
	const { userId } = getUserContext(userOrId);
	if (!userId) return;

	const key = getSearchHistoryKey(userId);
	localStorage.setItem(key, JSON.stringify(history));
};
