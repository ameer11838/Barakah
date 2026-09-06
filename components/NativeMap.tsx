import { forwardRef } from 'react';
import { View, type ViewProps } from 'react-native';

type StubProps = ViewProps & Record<string, unknown>;

/** Web stub. react-native-maps is native-only. */
export const MapView = forwardRef<View, StubProps>(function MapViewStub(props, ref) {
  return <View ref={ref} {...props} />;
});

export function Marker(props: StubProps) {
  return <View {...props} />;
}

export function Circle(props: StubProps) {
  return <View {...props} />;
}
