import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Correct import
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';

const BUTTON_WIDTH = 350;
const BUTTON_HEIGHT = 100;
const BUTTON_PADDING = 10;
const SWIPEABLE_DIMENSIONS = BUTTON_HEIGHT - 2 * BUTTON_PADDING;

const H_WAVE_RANGE = SWIPEABLE_DIMENSIONS + 2 * BUTTON_PADDING;
const H_SWIPE_RANGE = BUTTON_WIDTH - 2 * BUTTON_PADDING - SWIPEABLE_DIMENSIONS;

// REMOVE THIS LINE:
// const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface SwipeButtonProps {
  onToggle: (isToggled: boolean) => void;
  textOff?: string;
  textOn?: string;
}

const SwipeButton: React.FC<SwipeButtonProps> = ({ 
  onToggle,
  textOff = 'Deslize para ativar',
  textOn = 'Ativado',
   }) => {
  const X = useSharedValue(0);
  const [toggled, setToggled] = useState(false);

  const handleComplete = (isToggled: boolean) => {
    if (isToggled !== toggled) {
      setToggled(isToggled);
      onToggle(isToggled);
    }
  };

  const animatedGestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.completed = toggled;
    },
    onActive: (event, ctx: any) => {
      let newValue = ctx.completed
        ? H_SWIPE_RANGE + event.translationX
        : event.translationX;

      X.value = newValue < 0 ? 0 : newValue > H_SWIPE_RANGE ? H_SWIPE_RANGE : newValue;
    },
    onEnd: () => {
      const threshold = H_SWIPE_RANGE * 0.5;
      const shouldToggle = X.value >= threshold;

      X.value = withSpring(shouldToggle ? H_SWIPE_RANGE : 0, {
        damping: 15,
        stiffness: 120,
      });
      runOnJS(handleComplete)(shouldToggle);
    },
  });

  const inputRange = [0, H_SWIPE_RANGE];

  const animatedStyles = {
    colorWave: useAnimatedStyle(() => ({
      width: H_WAVE_RANGE + X.value,
      opacity: interpolate(X.value, inputRange, [0.3, 1], Extrapolate.CLAMP),
    })),

    swipeable: useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(
        X.value,
        inputRange,
        ['#0000FF', '#ffffff'],
      ),
      transform: [{ translateX: X.value }],
    })),

    swipeText: useAnimatedStyle(() => ({
      opacity: interpolate(X.value, inputRange, [1, 0], Extrapolate.CLAMP),
      transform: [
        {
          translateX: interpolate(
            X.value,
            inputRange,
            [0, 80], // Smoother text movement
            Extrapolate.CLAMP,
          ),
        },
      ],
    })),
  };

  return (
    <View style={styles.swipeCont}>
      {/* Use LinearGradient directly — it's already animatable in Expo */}
      <LinearGradient
        style={[styles.colorWave, animatedStyles.colorWave]}
        colors={['#0000FF', '#1b6aaaff']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />

      <PanGestureHandler onGestureEvent={animatedGestureHandler}>
        <Animated.View style={[styles.swipeable, animatedStyles.swipeable]}>
          <Text style={styles.swipeIcon}>{toggled ? 'Check' : '>'}</Text>
        </Animated.View>
      </PanGestureHandler>

      <Animated.Text style={[styles.swipeText, animatedStyles.swipeText]}>
        {toggled ? textOn : textOff}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeCont: {
    height: BUTTON_HEIGHT,
    width: BUTTON_WIDTH,
    backgroundColor: '#e5e5e5',
    borderRadius: BUTTON_HEIGHT / 2,
    padding: BUTTON_PADDING,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  colorWave: {
    position: 'absolute',
    left: 0,
    height: '100%',
    borderRadius: BUTTON_HEIGHT / 2,
  },
  swipeable: {
    position: 'absolute',
    left: BUTTON_PADDING,
    height: SWIPEABLE_DIMENSIONS,
    width: SWIPEABLE_DIMENSIONS,
    borderRadius: SWIPEABLE_DIMENSIONS / 2,
    zIndex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  swipeIcon: {
    color: '#ffffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  swipeText: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    zIndex: 2,
    color: '#0000FF',
    position: 'absolute',
    textAlign: 'center',
  },
});

export default SwipeButton;
