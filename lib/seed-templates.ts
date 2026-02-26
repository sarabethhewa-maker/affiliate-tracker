import { prisma } from '@/lib/prisma';

const DEFAULT_TEMPLATES = [
  {
    title: 'Introduction Email',
    category: 'email',
    subject: 'I found something amazing for your health',
    body: `Hi there!

I wanted to share something that's made a real difference for me — Biolongevity Labs. Their supplements are research-backed and have helped me feel more energized and focused.

If you're curious, you can check them out here: {{tracking_link}}

{{coupon_code}}

Happy to answer any questions!

{{affiliate_name}}`,
    sortOrder: 0,
  },
  {
    title: 'Product Recommendation',
    category: 'email',
    subject: 'A supplement brand I actually trust',
    body: `Hey!

Quick note — I've been using Biolongevity Labs products for a while now and wanted to pass along the link in case you're looking for quality supplements: {{tracking_link}}

Use my code if you'd like: {{coupon_code}}

— {{affiliate_name}}`,
    sortOrder: 1,
  },
  {
    title: 'Follow-Up Email',
    category: 'email',
    subject: 'Quick follow-up: Biolongevity Labs',
    body: `Hi,

Just following up on my last message about Biolongevity Labs. Here's my link again: {{tracking_link}}

{{coupon_code}}

Let me know if you have any questions.

{{affiliate_name}}`,
    sortOrder: 2,
  },
  {
    title: 'Instagram Post',
    category: 'social-instagram',
    subject: null,
    body: `Discover what's been game-changing for my routine 🔬 @biolongevitylabs — science-backed supplements that actually deliver.

Link in bio / swipe up: {{tracking_link}}

{{coupon_code}}

#BiolongevityLabs #Supplements #Wellness`,
    sortOrder: 0,
  },
  {
    title: 'TikTok / Short-Form Caption',
    category: 'social-tiktok',
    subject: null,
    body: `Trying @Biolongevity Labs — link in bio! {{tracking_link}} {{coupon_code}}`,
    sortOrder: 1,
  },
  {
    title: 'Facebook Post',
    category: 'social-facebook',
    subject: null,
    body: `I've been using Biolongevity Labs supplements and wanted to share the link with anyone looking for quality, research-backed options: {{tracking_link}}

Use my code for a discount: {{coupon_code}}

— {{affiliate_name}}`,
    sortOrder: 2,
  },
];

export async function seedMessageTemplatesIfEmpty(): Promise<number> {
  const count = await prisma.messageTemplate.count();
  if (count > 0) return 0;
  for (const t of DEFAULT_TEMPLATES) {
    await prisma.messageTemplate.create({
      data: {
        title: t.title,
        category: t.category,
        subject: t.subject ?? undefined,
        body: t.body,
        sortOrder: t.sortOrder,
        active: true,
      },
    });
  }
  return DEFAULT_TEMPLATES.length;
}
