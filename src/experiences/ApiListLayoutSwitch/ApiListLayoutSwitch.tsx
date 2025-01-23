import React, { useCallback } from 'react';
import { ToggleButton } from '@fluentui/react-components';
import { AppsListRegular, GridRegular } from '@fluentui/react-icons';
import { useRecoilState } from 'recoil';
import { Layouts } from '@/types/layouts';
import apiListLayoutAtom from '@/atoms/apiListLayoutAtom';
import styles from './ApiListLayoutSwitch.module.scss';

export const ApiListLayoutSwitch: React.FC = () => {
  const [layout, setLayout] = useRecoilState(apiListLayoutAtom);

  const handleBtnClick = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      setLayout(e.currentTarget.value as Layouts);
    },
    [layout]
  );

  return (
    <div className={styles.apiListLayoutSwitch}>
      <ToggleButton
        icon={<GridRegular />}
        value={Layouts.CARDS}
        checked={layout === Layouts.CARDS}
        onClick={handleBtnClick}
      />
      <ToggleButton
        icon={<AppsListRegular />}
        value={Layouts.TABLE}
        checked={layout === Layouts.TABLE}
        onClick={handleBtnClick}
      />
    </div>
  );
};

export default React.memo(ApiListLayoutSwitch);
