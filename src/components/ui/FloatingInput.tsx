import Ionicons from "@react-native-vector-icons/ionicons";
import { Ref, useState } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// ─── Konstanta animasi ─────────────────────────────────────────────────────────
const TIMING = { duration: 180 };

// ─── Types ────────────────────────────────────────────────────────────────────
interface FloatingInputProps extends Omit<TextInputProps, "style"> {
  label: string;
  placeholder: string;
  error?: string;
  secureTextEntry?: boolean;
  editable?: boolean;
  // ref diterima sebagai prop di pakai untuk pindah fokus antar kolom
  ref?: Ref<TextInput>;
}

// ─── Komponen ─────────────────────────────────────────────────────────────────
export function FloatingInput({
  label,
  placeholder,
  error,
  secureTextEntry = false,
  editable = true,
  ref,
  value,
  onBlur,
  onFocus,
  ...rest
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Label muncul saat fokus ATAU ada value
  const isLabelVisible = isFocused || !!value;

  // Animasi opacity label
  const labelOpacity = useSharedValue(isLabelVisible ? 1 : 0);
  const labelTranslateY = useSharedValue(isLabelVisible ? 0 : 4);

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelTranslateY.value }],
  }));

  const handleFocus = (e: any) => {
    labelOpacity.value = withTiming(1, TIMING);
    labelTranslateY.value = withTiming(0, TIMING);
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    if (!value) {
      labelOpacity.value = withTiming(0, TIMING);
      labelTranslateY.value = withTiming(4, TIMING);
    }
    setIsFocused(false);
    onBlur?.(e);
  };

  // ── Warna border ──
  const borderColor = error
    ? "#f87171"
    : isFocused
      ? "#006c50"
      : "rgba(196,198,206,0.4)";

  // ── Warna label ──
  const labelColor = error ? "#f87171" : isFocused ? "#006c50" : "#74777e";

  return (
    <View className="w-full gap-[2px]">
      {/* Label — muncul di atas input saat fokus atau ada value */}
      <Animated.View style={[labelAnimatedStyle, { height: 18 }]}>
        <Text
          style={{ color: labelColor }}
          className="text-[12px] font-semibold tracking-[0.24px] leading-[16px] pl-[2px]"
        >
          {label}
        </Text>
      </Animated.View>

      {/* Input wrapper */}
      <View
        className="relative bg-white rounded-[16px] h-[50px] justify-center"
        style={{ borderWidth: 1, borderColor }}
      >
        <TextInput
          ref={ref}
          className={`h-full text-[14px] text-[#001d37] font-normal px-[16px] ${
            secureTextEntry ? "pr-[48px]" : "pr-[16px]"
          }`}
          placeholder={
            isFocused && !value
              ? placeholder
              : !isFocused && !value
                ? placeholder
                : ""
          }
          placeholderTextColor="rgba(116,119,126,0.6)"
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          secureTextEntry={secureTextEntry && !showPassword}
          underlineColorAndroid="transparent"
          {...rest}
        />

        {/* Toggle show/hide password */}
        {secureTextEntry && (
          <TouchableOpacity
            className="absolute right-[14px] p-[4px]"
            style={{ top: 11 }}
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="rgba(116,119,126,0.8)"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Pesan error */}
      {error && (
        <Text className="text-red-500 text-[11px] leading-[14px] pl-[4px]">
          {error}
        </Text>
      )}
    </View>
  );
}
