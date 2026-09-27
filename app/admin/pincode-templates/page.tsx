import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/app/components/PageHeader';
import { PincodeTemplateList } from './pincode-template-list';

export default async function PincodeTemplatesPage() {
  const templates = await prisma.pincodeTemplate.findMany({
    orderBy: { title: 'asc' },
    include: {
      entries: { select: { code: true }, orderBy: { code: 'asc' } },
      _count: { select: { products: true } },
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <PageHeader
        title="Pincode templates"
        description="Reusable delivery pincode lists you can attach to products."
        variant="admin"
        overline="Delivery"
      />
      <PincodeTemplateList
        templates={templates.map((template) => ({
          id: template.id,
          title: template.title,
          pincodes: template.entries.map((entry) => entry.code),
          productCount: template._count.products,
        }))}
      />
    </main>
  );
}
