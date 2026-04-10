const fs = require('fs');
const file = 'frontend/src/components/common/post/CommentItem.jsx';
let content = fs.readFileSync(file, 'utf8');

const anchor = `        onSuccess: () => {
            // Invalidate all post queries to ensure UI updates everywhere
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },`;

const fix = `    const { mutate: likeUnlikeComment } = useMutation({
        mutationFn: async () => {
            const res = await fetch(\`/api/posts/comment/\${postId}/\${comment._id}/like\`, {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        },
        onSuccess: () => {
            // Invalidate all post queries to ensure UI update
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
    });`;

if (content.includes(anchor)) {
    content = content.replace(anchor, fix);
    fs.writeFileSync(file, content);
    console.log("Repaired CommentItem.jsx");
} else {
    console.log("Could not find anchor in CommentItem.jsx");
}
