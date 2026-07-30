import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import colors from '@/constants/colors';

interface NeonButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  outlined?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  disabled?: boolean;
}

export function NeonButton({
  label,
  onPress,
  color = colors.dark.primary,
  outlined = false,
  size = 'md',
  style,
  disabled = false,
}: NeonButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const heights = { sm: 38, md: 48, lg: 58 };
  const fontSizes = { sm: 12, md: 14, lg: 16 };

  return (
    <TouchableWithoutFeedback
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.button,
          {
            height: heights[size],
            backgroundColor: outlined ? 'transparent' : color,
            borderColor: color,
            opacity: disabled ? 0.4 : 1,
            transform: [{ scale: scaleAnim }],
            shadowColor: color,
          },
          style,
        ]}
      >
        <Text
          style={[
            styles.label,
            {
              fontSize: fontSizes[size],
              color: outlined ? color : colors.dark.background,
            },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 14,
    shadowOpacity: 0.5,
    elevation: 6,
  },
  label: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 3,
  },
});
