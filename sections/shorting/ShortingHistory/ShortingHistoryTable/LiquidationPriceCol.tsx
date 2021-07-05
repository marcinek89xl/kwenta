import { FC, useMemo } from 'react';
import { CellProps } from 'react-table';

import { HistoricalShortPosition } from 'queries/collateral/subgraph/types';
import useCollateralShortContractInfoQuery from 'queries/collateral/useCollateralShortContractInfoQuery';

import useSelectedPriceCurrency from 'hooks/useSelectedPriceCurrency';

import { getExchangeRatesForCurrencies } from 'utils/currencies';
import { formatCurrency } from 'utils/formatters/number';

import { MIN_COLLATERAL_RATIO } from 'sections/shorting/constants';

import { StyledCurrencyKey, StyledPrice } from './common';
import useSynthetixQueries from '@synthetixio/queries';
import { wei } from '@synthetixio/wei';
import { useRecoilValue } from 'recoil';
import { networkState } from 'store/wallet';

type LiquidationPriceColType = {
	cellProps: CellProps<HistoricalShortPosition>;
};

const LiquidationPriceCol: FC<LiquidationPriceColType> = ({ cellProps }) => {
	const network = useRecoilValue(networkState);
	const { useExchangeRatesQuery } = useSynthetixQueries({
		networkId: network.id,
	});

	const exchangeRatesQuery = useExchangeRatesQuery();
	const { selectedPriceCurrency, selectPriceCurrencyRate } = useSelectedPriceCurrency();

	const exchangeRates = useMemo(
		() => (exchangeRatesQuery.isSuccess ? exchangeRatesQuery.data ?? null : null),
		[exchangeRatesQuery.isSuccess, exchangeRatesQuery.data]
	);

	const {
		collateralLockedAmount,
		synthBorrowedAmount,
		collateralLocked,
		synthBorrowed,
	} = cellProps.row.original;

	const collateralLockedPrice = getExchangeRatesForCurrencies(
		exchangeRates,
		collateralLocked,
		selectedPriceCurrency.name
	);

	const collateralShortContractInfoQuery = useCollateralShortContractInfoQuery();

	const collateralShortContractInfo = collateralShortContractInfoQuery.isSuccess
		? collateralShortContractInfoQuery?.data ?? null
		: null;

	const minCollateralRatio = useMemo(
		() => collateralShortContractInfo?.minCollateralRatio ?? MIN_COLLATERAL_RATIO,
		[collateralShortContractInfo?.minCollateralRatio]
	);

	const liquidationPrice = useMemo(
		() =>
			synthBorrowedAmount.gt(0)
				? collateralLockedAmount
						.mul(collateralLockedPrice)
						.div(synthBorrowedAmount.mul(minCollateralRatio))
				: wei(0),
		[collateralLockedAmount, collateralLockedPrice, synthBorrowedAmount, minCollateralRatio]
	);

	return (
		<span>
			<StyledPrice>
				{formatCurrency(
					collateralLocked,
					selectPriceCurrencyRate != null
						? liquidationPrice.div(selectPriceCurrencyRate)
						: liquidationPrice,
					{
						sign: selectedPriceCurrency.sign,
					}
				)}
			</StyledPrice>
			<StyledCurrencyKey>{synthBorrowed}</StyledCurrencyKey>
		</span>
	);
};

export default LiquidationPriceCol;
