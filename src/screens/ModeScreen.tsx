import React, { useLayoutEffect } from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { findModule } from '../content/tracks';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';
import { ListenMode } from './modes/ListenMode';
import { DrillMode } from './modes/DrillMode';
import { RoleplayMode } from './modes/RoleplayMode';

type Props = NativeStackScreenProps<RootStackParamList, 'Mode'>;

export function ModeScreen({ route, navigation }: Props) {
  const { trackId, moduleId, mode } = route.params;
  const mod = findModule(trackId, moduleId);

  useLayoutEffect(() => {
    const label = mode.charAt(0).toUpperCase() + mode.slice(1);
    navigation.setOptions({ title: mod ? `${mod.title} · ${label}` : label });
  }, [mod, mode, navigation]);

  if (!mod) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>Module not found.</Text>
      </Screen>
    );
  }

  switch (mode) {
    case 'listen':
      return <ListenMode mod={mod} />;
    case 'drill':
      return <DrillMode mod={mod} />;
    case 'roleplay':
      return <RoleplayMode mod={mod} />;
  }
}
