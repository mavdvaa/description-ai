import express from "express"
import { tryAI } from "./ai.js"
import 'dotenv/config'

const app = express()
const port = process.env.PORT || 3000

app.post('/product', express.json(), async (req, res) => {
    const data = req.body

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return res.status(400).json({ error: "Отправьте JSON с данными товара" })
    }

    if (typeof data.name !== "string" || !data.name.trim()) {
        return res.status(400).json({ error: "Укажите название товара" })
    }

    if (typeof data.manufacturer !== "string" || !data.manufacturer.trim()) {
        return res.status(400).json({ error: "Укажите производителя" })
    }

    if (
        !data.specs ||
        typeof data.specs !== "object" ||
        Array.isArray(data.specs) ||
        Object.keys(data.specs).length === 0
    ) {
        return res.status(400).json({ error: "Поле specs должно содержать характеристики товара" })
    }

    for (const [key, value] of Object.entries(data.specs)) {
        if (!key.trim() || value === null || typeof value === "object") {
            return res.status(400).json({ error: "У каждой характеристики должно быть название и значение" })
        }

        if (typeof value === "string" && !value.trim()) {
            return res.status(400).json({ error: `Укажите значение характеристики «${key}»` })
        }

        if (typeof value === "number" && !Number.isFinite(value)) {
            return res.status(400).json({ error: `Проверьте значение характеристики «${key}»` })
        }
    }

    if (typeof data.description !== "string" || !data.description.trim()) {
        return res.status(400).json({ error: "Укажите описание товара" })
    }

    try {
        const result = await tryAI(data)
        let message = ""

        if (result && result.choices && result.choices[0] && result.choices[0].message) {
            message = result.choices[0].message.content
        }

        if (typeof message !== "string" || !message.trim()) {
            return res.status(502).json({ error: "Модель не вернула текст карточки. Попробуйте повторить запрос." })
        }

        return res.status(200).json({ message })
    } catch (error) {
        console.error("Ошибка запроса к модели:", error.message)

        return res.status(503).json({ error: "Не удалось подключиться к сервису модели. Проверьте интернет-соединение и попробуйте позже." })
    }
})

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`)
})