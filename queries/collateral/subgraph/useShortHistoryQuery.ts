import { useQuery, QueryConfig } from 'react-query';
import { useRecoilValue } from 'recoil';
import { gql, request } from 'graphql-request';

import { appReadyState } from 'store/app';
import { walletAddressState, isWalletConnectedState } from 'store/wallet';
import QUERY_KEYS from 'constants/queryKeys';

import { HistoricalShortPosition } from './types';
import { formatShort, SHORT_GRAPH_ENDPOINT } from './utils';

// TODO: remove mocked address
const mockWalletAddress = '0x864b81c40d8314d5c4289a14eb92f03b9f43b6bc';

const useShortHistoryQuery = (options?: QueryConfig<HistoricalShortPosition[]>) => {
	const isAppReady = useRecoilValue(appReadyState);
	const isWalletConnected = useRecoilValue(isWalletConnectedState);
	const walletAddress = useRecoilValue(walletAddressState);

	return useQuery<HistoricalShortPosition[]>(
		QUERY_KEYS.Collateral.ShortHistory(walletAddress ?? ''),
		async () => {
			const response = await request(
				SHORT_GRAPH_ENDPOINT,
				gql`
					query shorts($account: String!) {
						shorts(where: { account: $account, isOpen: true }, orderBy: id, orderDirection: desc) {
							id
							txHash
							account
							collateralLocked
							collateralLockedAmount
							synthBorrowed
							synthBorrowedAmount
							isOpen
							createdAt
							closedAt
						}
					}
				`,
				{
					account: mockWalletAddress,
				}
			);
			return (response?.shorts ?? []).map(formatShort);
		},
		{
			enabled: isAppReady && isWalletConnected,
			...options,
		}
	);
};

export default useShortHistoryQuery;
