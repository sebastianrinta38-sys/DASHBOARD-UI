/**
 * Shared Currency conversion utilities and configuration options
 */

export interface CurrencyOption {
  code: string;
  label: string;
  countryKey: string;
  defaultRate: number;
  symbol: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'USD', label: 'Dólar (USD)', countryKey: 'Ecuador', defaultRate: 1, symbol: '$' },
  { code: 'COP', label: 'Peso Colombiano (COP)', countryKey: 'Colombia', defaultRate: 4000, symbol: '$' },
  { code: 'MXN', label: 'Peso Mexicano (MXN)', countryKey: 'México', defaultRate: 18.5, symbol: '$' },
  { code: 'BOB', label: 'Boliviano (BOB)', countryKey: 'Bolivia', defaultRate: 6.9, symbol: 'Bs.' },
  { code: 'PEN', label: 'Sol Peruano (PEN)', countryKey: 'Perú', defaultRate: 3.7, symbol: 'S/' },
  { code: 'VES', label: 'Bolívar Venezolano (VES)', countryKey: 'Venezuela', defaultRate: 36, symbol: 'Bs.' },
];

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
  countryKey: string;
}

export function getActiveCurrencyConfig(
  selectedCurrency: string,
  countriesConfig: Record<string, { currency?: string; rate: number }> = {}
): CurrencyConfig {
  const opt = CURRENCY_OPTIONS.find(c => c.code === selectedCurrency) || CURRENCY_OPTIONS[0];
  let rate = 1;
  if (opt.code !== 'USD') {
    rate = countriesConfig[opt.countryKey]?.rate || opt.defaultRate;
  }
  return {
    code: opt.code,
    symbol: opt.symbol,
    rate,
    countryKey: opt.countryKey,
  };
}

export function formatConvertedMoney(
  amountUsd: number,
  currencyConfig: CurrencyConfig
): string {
  const converted = amountUsd * currencyConfig.rate;
  const isZeroDecimals = currencyConfig.code === 'COP' || currencyConfig.code === 'CLP';
  
  const formattedNumber = converted.toLocaleString('en-US', {
    minimumFractionDigits: isZeroDecimals ? 0 : 2,
    maximumFractionDigits: isZeroDecimals ? 0 : 2,
  });

  return `${currencyConfig.symbol}${formattedNumber} ${currencyConfig.code}`;
}
