export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Against USD (1 USD = rate in target currency)
  flag: string;
}

export const ALL_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79, flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rate: 1.36, flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.52, flag: '🇦🇺' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 83.50, flag: '🇮🇳' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED ', rate: 3.67, flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR ', rate: 3.75, flag: '🇸🇦' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 155.0, flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 7.24, flag: '🇨🇳' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF ', rate: 0.90, flag: '🇨🇭' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 1.35, flag: '🇸🇬' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.64, flag: '🇳🇿' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 5.15, flag: '🇧🇷' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R ', rate: 18.20, flag: '🇿🇦' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', rate: 16.80, flag: '🇲🇽' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', rate: 278.0, flag: '🇵🇰' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', rate: 58.0, flag: '🇵🇭' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 1420.0, flag: '🇳🇬' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 32.50, flag: '🇹🇷' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', rate: 47.50, flag: '🇪🇬' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 1370.0, flag: '🇰🇷' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr ', rate: 10.60, flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr ', rate: 10.70, flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr ', rate: 6.85, flag: '🇩🇰' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł ', rate: 3.95, flag: '🇵🇱' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR ', rate: 3.64, flag: '🇶🇦' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD ', rate: 0.31, flag: '🇰🇼' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BHD ', rate: 0.38, flag: '🇧🇭' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR ', rate: 0.385, flag: '🇴🇲' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM ', rate: 4.70, flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp ', rate: 16200.0, flag: '🇮🇩' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', rate: 36.50, flag: '🇹🇭' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', rate: 25400.0, flag: '🇻🇳' },
  { code: 'COP', name: 'Colombian Peso', symbol: 'COL$', rate: 3850.0, flag: '🇨🇴' },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'ARS$', rate: 880.0, flag: '🇦🇷' },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$', rate: 930.0, flag: '🇨🇱' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', rate: 3.72, flag: '🇮🇱' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh ', rate: 132.0, flag: '🇰🇪' }
];

export function getCurrency(code = 'USD'): CurrencyInfo {
  return ALL_CURRENCIES.find((c) => c.code === code) || ALL_CURRENCIES[0];
}

export function formatPrice(amountInUSD: number, currencyCode = 'USD'): string {
  const curr = getCurrency(currencyCode);
  const converted = amountInUSD * curr.rate;
  
  if (curr.rate >= 100) {
    return `${curr.symbol}${Math.round(converted).toLocaleString()}`;
  }
  return `${curr.symbol}${converted.toFixed(2)}`;
}
