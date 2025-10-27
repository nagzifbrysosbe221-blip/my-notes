import { PrismaClient } from "@prisma/client"
const db = new PrismaClient()

async function main() {
  const user = await db.user.upsert({
    where: { email: "dev@local" },
    update: {},
    create: { email: "dev@local", name: "dev" },
  })

  const book = await db.book.create({
    data: { title: "My First Book", ownerId: user.id, description: "Demo book" },
  })

  const ch = await db.chapter.create({
    data: { bookId: book.id, title: "Chapter 1", order: 1 },
  })

  const sub = await db.subchapter.create({
    data: { chapterId: ch.id, title: "Intro", order: 1 },
  })

  await db.note.create({
    data: {
      subchapterId: sub.id,
      type: "CORE",
      title: "What is X?",
      content: "Foundational note.",
    },
  })

  await db.mCQQuestion.create({
    data: {
      subchapterId: sub.id,
      prompt: "Which option is correct?",
      choices: {
        create: [
          { label: "A", text: "Alpha", isCorrect: true, explanation: "A is correct." },
          { label: "B", text: "Beta", isCorrect: false, explanation: "B is not correct." },
          { label: "C", text: "Gamma", isCorrect: false },
          { label: "D", text: "Delta", isCorrect: false },
        ],
      },
    },
  })
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e)
    return db.$disconnect().finally(() => process.exit(1))
  })
