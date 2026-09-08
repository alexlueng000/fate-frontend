import type { ProductDetail } from '@/app/lib/api';

export function packageText(text: string) {
  return text
    .replace(/基础版会员/g, '基础套餐')
    .replace(/高级版会员/g, '高级套餐')
    .replace(/基础会员/g, '基础套餐')
    .replace(/高级会员/g, '高级套餐')
    .replace(/会员套餐/g, '套餐')
    .replace(/会员月卡/g, '月度套餐')
    .replace(/会员/g, '套餐');
}

export function withPackageDisplay(product: ProductDetail): ProductDetail {
  if (product.kind !== 'subscription') return product;
  return {
    ...product,
    name: packageText(product.name),
    description: product.description ? packageText(product.description) : product.description,
  };
}
