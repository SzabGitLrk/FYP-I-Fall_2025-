import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteCourses() {
  try {
    console.log('Starting to delete all courses...')
    
    // Delete all courses (this will cascade to timetables and enrollments)
    const result = await prisma.course.deleteMany({})
    
    console.log(`✅ Successfully deleted ${result.count} courses`)
    console.log('Note: Related timetables and enrollments were also deleted due to cascade rules')
    
  } catch (error) {
    console.error('❌ Error deleting courses:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteCourses()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
