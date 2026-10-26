import { View, ViewStyle } from "react-native";

const COLORS = {
  green: "rgba(127,249,204,0.15)",
  blue: "rgba(222,233,252,0.3)",
};

export function AmbientBlob({
  color = "green",
  className = "",
  style,
}: {
  color?: "green" | "blue";
  className?: string;
  style?: ViewStyle;
}) {
  return (
    <View
      className={`absolute rounded-full ${className}`}
      style={[{ backgroundColor: COLORS[color] }, style]}
    />
  );
}
