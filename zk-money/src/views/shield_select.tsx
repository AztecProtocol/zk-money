import React, { useMemo, useState } from 'react';
import styled from 'styled-components/macro';
import { Button, LegacySelect, ShieldedAssetIcon, Text } from '../components';
import { borderRadiuses, colours, defaultTextColour, fontSizes, inputSizes, spacings, themeColours } from '../styles';
import arrowDownGradient from '../images/arrow_down_gradient.svg';
import { formatValueAsBulkPrice, formatBaseUnits, toBaseUnits } from '../app';
import { KNOWN_MAINNET_ASSET_ADDRESSES as KMAA } from 'alt-model/known_assets/known_asset_addresses';
import { useRemoteAssetForId } from 'alt-model/top_level_context';

const Root = styled.div`
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
`;

const Header = styled.div`
  font-size: ${fontSizes.l};
  color: ${themeColours.GRADIENT.text};
  padding: 0 ${spacings.l};
  height: 100px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Body = styled.div`
  background: ${colours.white};
  border-radius: ${borderRadiuses.m};
  padding: ${spacings.l};
  display: flex;
  flex-direction: column;
  gap: ${spacings.l};
`;

const AnnotatedSelectWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacings.xs};
  align-items: flex-end;
`;

const SelectWrapper = styled.div`
  width: 100%;
  display: grid;
`;

const Selection = styled.div`
  background: ${colours.white};
  border-radius: ${borderRadiuses.s};
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  height: ${inputSizes.m};
  display: flex;
  padding: 0 ${spacings.s};
  align-items: center;
  gap: ${spacings.s};
`;

const Spacer = styled.div`
  flex-grow: 1;
`;

const DownArrow = styled.div`
  background: url(${arrowDownGradient});
  width: 20px;
  height: 20px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
`;

const SelectItem = styled.div`
  width: 100%;
  padding-left: 57px;
  padding-right: 37px;
`;

const SelectItemContent = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

const AMOUNT_OPTS = ['0.01', '0.1', '1', '10'].map(x => toBaseUnits(x, 18));

interface ShieldSelectProps {
  onSubmit: (value: bigint) => void;
  ethUnitPrice?: bigint;
}

export const ShieldSelect: React.FunctionComponent<ShieldSelectProps> = ({ onSubmit, ethUnitPrice }) => {
  const assetEth = useRemoteAssetForId(0);
  const items = useMemo(
    () =>
      assetEth &&
      AMOUNT_OPTS.map(amount => {
        const label = (
          <SelectItemContent>
            <Text color="grey" italic size="m">
              {ethUnitPrice !== undefined && `$${formatValueAsBulkPrice(amount, assetEth.decimals, ethUnitPrice)}`}
            </Text>
            <Text color={defaultTextColour} size="m">
              {formatBaseUnits(amount, assetEth.decimals)} {assetEth.symbol}
            </Text>
          </SelectItemContent>
        );
        const content = <SelectItem>{label}</SelectItem>;
        return { id: amount, label, content };
      }),
    [ethUnitPrice, assetEth],
  );
  const [selectedAmount, setSelectedAmount] = useState(AMOUNT_OPTS[1]);
  const selectedItem = items?.find(x => x.id === selectedAmount);
  return (
    <Root>
      <Header>
        <Text>Shield ETH</Text>
        <ShieldedAssetIcon address={KMAA.ETH} white size="xl" />
      </Header>
      <Body>
        <AnnotatedSelectWrapper>
          {/* TODO: this should be dynamic, but requires the sdk to be intialised first */}
          <Text size="xs" color="grey">
            ~ settles in 6 hours
          </Text>
          <SelectWrapper>
            <LegacySelect
              items={items ?? []}
              trigger={
                <Selection>
                  <ShieldedAssetIcon address={KMAA.ETH} size="m" />
                  <Spacer />
                  {selectedItem?.label}
                  <DownArrow />
                </Selection>
              }
              onSelect={setSelectedAmount}
            />
          </SelectWrapper>
        </AnnotatedSelectWrapper>
        <Button onClick={() => onSubmit(selectedAmount)}>Shield Now</Button>
      </Body>
    </Root>
  );
};
