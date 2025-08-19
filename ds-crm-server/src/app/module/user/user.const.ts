export const userSearchableField = [
  "email",
  "firstName",
  "lastName",
  "contactNumber",
];

export const userFilterField = ["role", "status", "searchTerm"];

// const performance = await prisma.order.groupBy({
//     by: ['createdByEmployeeId'],
//     where: {
//       createdAt: {
//         gte: new Date('2024-01-01'),
//         lt: new Date('2024-02-01')
//       },
//       status: 'CONFIRMED'
//     },
//     _count: { id: true },
//     _sum: { totalBill: true }
//   })
