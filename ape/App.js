import { useState } from "react";
import { StyleSheet, View, Text, Button } from "react-native";
import { Picker } from "@react-native-picker/picker";
import PoseCamera from "./components/PoseCamera";

export default function App() {
  const [exercise, setExercise] = useState("roscaDireta");
  const [start, setStart] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>APE - Assistente Pessoal de Exercícios</Text>

      {!start && (
        <View style={styles.box}>
          <Text style={styles.label}>Selecione o exercício:</Text>

          <Picker
            style={styles.picker}
            selectedValue={exercise}
            onValueChange={setExercise}
          >
            <Picker.Item label="Rosca Direta" value="roscaDireta" />
            <Picker.Item label="Meio Agachamento" value="meioAgachamento" />
          </Picker>

          <Button title="Iniciar Avaliação" onPress={() => setStart(true)} />
        </View>
      )}

      {start && (
        <PoseCamera
          exercise={exercise}
          onExit={() => setStart(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 50,
  },
  title: {
    color: "#00ff00",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  box: {
    padding: 20,
  },
  label: {
    color: "#fff",
    marginBottom: 10,
  },
  picker: {
    backgroundColor: "#222",
    color: "#00ff00",
    marginBottom: 20,
  }
});
