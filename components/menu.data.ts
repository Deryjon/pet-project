export interface IMenuItem {
    name: string;
    url: string;
    icon: string;
    items?: { title: string; url: string }[];
  }
  
  export const MENU_DATA: IMenuItem[] = [
    {
      name: 'РўРѕРІР°СЂС‹',
      icon: 'heroicons:cube',
      url: '/products',
      items: [
        { title: 'РљР°С‚Р°Р»РѕРі', url: '/products/catalog' },
        { title: 'РРјРїРѕСЂС‚', url: '/products/import' },
        { title: 'Р—Р°РєР°Р·С‹', url: '/products/orders' },
        { title: 'РРЅРІРµРЅС‚Р°СЂРёР·Р°С†РёСЏ', url: '/products/inventory' },
        { title: 'РўСЂР°РЅСЃС„РµСЂ', url: '/products/transfer' },
        { title: 'РџРµСЂРµРѕС†РµРЅРєР°', url: '/products/revaluation' },
        { title: 'РЎРїРёСЃР°РЅРёРµ', url: '/products/writeoff' },
        { title: 'РџРѕСЃС‚Р°РІС‰РёРєРё', url: '/products/suppliers' },
      ],
    },
    {
      name: 'РџСЂРѕРґР°Р¶Рё',
      icon: 'heroicons:shopping-cart',
      url: '/order',
      items: [
        { title: 'РќРѕРІР°СЏ РїСЂРѕРґР°Р¶Р°', url: '/pos/new-pos' },
        { title: 'Р’СЃРµ РїСЂРѕРґР°Р¶Рё', url: '/pos/all' },
      ],
    },
    {
      name: 'РљР»РёРµРЅС‚С‹',
      icon: 'heroicons:user-group',
      url: '/clients',
      items: [
        { title: 'Р’СЃРµ РєР»РёРµРЅС‚С‹', url: '/clients/all' },
        { title: 'РџСЂРѕРіСЂР°РјРјР° Р»РѕСЏР»СЊРЅРѕСЃС‚Рё', url: '/clients/loyalty-program' },
        { title: 'Р”РѕР»РіРё РєР»РёРµРЅС‚РѕРІ', url: '/clients/cashbox' },
      ],
    },
    {
      name: 'РћС‚С‡РµС‚С‹',
      icon: 'heroicons:chart-pie',
      url: '/analytics',
      items: [
        { title: 'РњР°РіР°Р·РёРЅ', url: '/analytics/shop' },
        { title: 'РўРѕРІР°СЂС‹', url: '/analytics/products' },
        { title: 'РџСЂРѕРґР°РІС†С‹', url: '/analytics/sellers' },
        { title: 'РљР»РёРµРЅС‚С‹', url: '/analytics/clients' },
      ],
    },
    {
      name: 'РЈРїСЂР°РІР»РµРЅРёРµ',
      icon: 'uil:bag',
      url: '',
      items: [
        { title: 'РЎРѕС‚СЂСѓРґРЅРёРєРё', url: '/management/employees' },
        { title: 'Р РѕР»Рё', url: '/management/roles' },
      ],
    },
    {
      name: 'РќР°СЃС‚СЂРѕР№РєРё',
      icon: 'uil:cog',
      url: '',
      items: [
        { title: 'Профиль', url: '/settings/profile' },
        { title: 'Компания', url: '/settings/company' },
        { title: 'Магазин', url: '/settings/shop' },
        { title: 'Чеки', url: '/settings/checks' }
      ],
    },
  ];
  
