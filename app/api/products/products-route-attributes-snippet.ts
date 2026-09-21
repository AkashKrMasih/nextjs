const product = await prisma.product.create({
  data: {
    // ...your other fields (name, description, price, categoryId, images, variants)...
    attributes: {
      create: body.attributes.map((attr: { title: string; values: string[] }) => ({
        title: attr.title,
        values: {
          create: attr.values.map((value: string) => ({ value })),
        },
      })),
    },
  },
});

await prisma.$transaction([
  prisma.productAttribute.deleteMany({ where: { productId: id } }),
  prisma.product.update({
    where: { id },
    data: {
      // ...your other fields...
      attributes: {
        create: body.attributes.map((attr: { title: string; values: string[] }) => ({
          title: attr.title,
          values: {
            create: attr.values.map((value: string) => ({ value })),
          },
        })),
      },
    },
  }),
]);
