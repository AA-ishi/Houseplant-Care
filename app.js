// ===============================
// CSV 読み込み
// ===============================
async function loadCSV() {
    const response = await fetch("assets/data/plant_database.csv");
    const text = await response.text();

    const rows = text.trim().split("\n").map(r => r.split(","));
    const header = rows[0];
    const data = rows.slice(1).map(row => {
        return {
            名前: row[0],
            水の必要量: row[1],
            推奨頻度_日: Number(row[2])
        };
    });

    return data;
}

// ===============================
// 水やり頻度の補正ロジック
// ===============================
function adjustWatering(baseDays, location) {
    if (location === "日がよく当たる窓際") return baseDays;
    if (location === "あまり日が当たらない窓際") return baseDays + 2;
    if (location === "明るいけれど窓際ではない場所") return baseDays + 1;
    if (location === "日が当たらない場所") return baseDays + 5;
    return baseDays;
}

// ===============================
// AI 呼び出し
// ===============================
async function callAI(plantName) {
    const prompt = `
${plantName} の室内管理方法を、園芸初心者にもわかるように、260字程度で完結させてください。
${plantName}が植物でない場合は${plantName}の紹介をしてください。
置き場所、温度、湿度、肥料、病害虫対策などもあれば教えてください。
`;

    const response = await fetch("YOUR_SAKURA_AI_ENDPOINT", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer YOUR_API_KEY"
        },
        body: JSON.stringify({
            model: "YOUR_MODEL",
            messages: [
                { role: "system", content: "あなたはユーモアのある植物ケアの専門家です。" },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 250
        })
    });

    const result = await response.json();
    return result.choices?.[0]?.message?.content || "AIの回答を取得できませんでした。";
}

// ===============================
// メイン処理
// ===============================
document.getElementById("runBtn").addEventListener("click", async () => {
    const plantName = document.getElementById("plantName").value.trim();
    const location = document.getElementById("location").value;

    if (!plantName) {
        alert("植物の名前を入力してください");
        return;
    }

    const data = await loadCSV();
    const match = data.find(item => item.名前 === plantName);

    // 水やり頻度
    if (match) {
        const base = match.推奨頻度_日;
        const adjusted = adjustWatering(base, location);

        document.getElementById("wateringResult").textContent =
            `💧 水やり頻度\n${adjusted} 日ごとに水やりをしてみましょう。\n鉢底から水が流れるくらいタップリあげてください。\n植物の様子を見て頻度を調整しましょう。`;
    } else {
        document.getElementById("wateringResult").textContent =
            "水やりの頻度は育て方を参考にしてください。";
    }

    // AI アドバイス
    const aiText = await callAI(plantName);
    document.getElementById("aiResult").textContent = aiText;
});
