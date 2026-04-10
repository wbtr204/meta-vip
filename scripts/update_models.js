import fs from 'fs';

let file = 'backend/models/post.model.js';
let content = fs.readFileSync(file, 'utf8');

// Replace using a simple split-join or replace
content = content.replace(
    'createdAt: { type: Date, default: Date.now },',
    `likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],\n\t\t\t\tcreatedAt: { type: Date, default: Date.now },`
);

fs.writeFileSync(file, content);
console.log("Updated post.model.js");

file = 'backend/models/notification.model.js';
content = fs.readFileSync(file, 'utf8');
content = content.replace(
    'enum: ["follow", "like", "comment", "mention", "system", "follow_request", "follow_accept"],',
    'enum: ["follow", "like", "comment", "mention", "system", "follow_request", "follow_accept", "like_comment", "reply"],'
);
fs.writeFileSync(file, content);
console.log("Updated notification.model.js");
