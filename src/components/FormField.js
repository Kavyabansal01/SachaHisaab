import { Text, TextInput, View } from 'react-native';
import { globalStyles } from '../theme';

export function FormField({ label, value, onChangeText, keyboardType = 'default', placeholder, multiline = false }) {
  return (
    <View>
      <Text style={globalStyles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder || label}
        multiline={multiline}
        style={[globalStyles.input, multiline && { minHeight: 90, textAlignVertical: 'top', paddingTop: 14 }]}
      />
    </View>
  );
}
