import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Clipboard,
  ToastAndroid,
} from "react-native";
import * as SQLite from "expo-sqlite";
import styled from "styled-components/native";
import { format, intervalToDuration, isAfter, isBefore } from "date-fns";
import DialogInput from "react-native-dialog-input";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { FontAwesome } from "@expo/vector-icons";

const AddButton = styled(FontAwesome.Button)`
  background-color: red;
`;
const CopyButton = styled(FontAwesome.Button)`
  background-color: papayawhip;
`;

const ListItem = styled(TouchableOpacity)`
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #e0d3d3;
`;

const HeaderWrapper = styled.View`
  display: flex;
  margin-top: 25px;
  margin-bottom: 10px;
  padding: 25px;
  justify-content: space-between;
  flex-direction: row;
`;

const Container = styled.View`
  flex: 1;
  background-color: papayawhip;
  justify-content: center;
  align-items: center;
`;

const ListWrapper = styled.View`
  border-top-width: 1px;
  border-top-color: #e0d3d3;
  padding: 1px;
  flex: 1;
`;

const Title = styled.Text`
  font-size: 26px;
  padding-right: 105px;
  align-self: flex-start;
`;

const SubTitle = styled.Text`
  padding-left: 20px;
  font-size: 16px;
  align-self: flex-start;
`;

const ButtonWrapper = styled.View`
  margin-top: 100px;
  margin-bottom: 80px;
`;

const db = SQLite.openDatabase("pop");

export default function App() {
  const [currentKey, setCurrentKey] = useState(0);
  const [items, setItems] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showImportInputModal, setShowImportInputModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const showDeleteItem = (id?: string) => {
    Alert.alert(
      "Are you sure?",
      id
        ? "You are about to delete this. Do you want to continue?"
        : "You are about to delete All. Do you want to continue?",
      [
        {
          text: "No",
        },
        {
          text: "Yes",
          onPress: () => {
            id ? deleteItem(id) : deleteAll();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const copyToClip = () => {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from items ORDER BY id DESC;`,
        null,
        (_, { rows: { _array } }) => {
          Clipboard.setString(JSON.stringify(_array));
          ToastAndroid.show("Copied all data!", ToastAndroid.SHORT);
        }
      );
    });
  };

  const importData = (dataString: string) => {
    const dataArray = JSON.parse(dataString);
    dataArray.forEach((item) => {
      db.transaction((tx) => {
        tx.executeSql("insert into items (id, dateTime) values (?,?)", [
          item.id,
          item.dateTime,
        ]);
      });
    });
    refreshState();
  };

  const refreshState = () => {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from items ORDER BY id DESC;`,
        null,
        (_, { rows: { _array } }) => {
          setItems(_array);
          _array[0]?.id && setCurrentKey(_array[0]?.id);
        }
      );
    });
  };

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, dateTime text);"
      );
    });
    refreshState();
  }, []);

  const addItem = (id: number, text: string) => {
    db.transaction((tx) => {
      tx.executeSql("insert into items (id, dateTime) values (?,?)", [
        id,
        text,
      ]);
    });
    refreshState();
  };

  const editItem = (id: number, text: string) => {
    db.transaction((tx) => {
      tx.executeSql("update items set dateTime=? where id=?", [text, id]);
    });
    refreshState();
  };

  const deleteItem = (id) => {
    db.transaction((tx) => {
      tx.executeSql("delete from items where id=?", [id]);
    });
    refreshState();
  };

  const deleteAll = () => {
    db.transaction((tx) => {
      tx.executeSql("delete from items");
    });
    refreshState();
    setCurrentKey(0);
  };

  return (
    <Container>
      <HeaderWrapper>
        <Title> Counter </Title>
        <CopyButton
          color="black"
          name="trash"
          onLongPress={() => showDeleteItem()}
        />
        <CopyButton
          color="black"
          name="download"
          onPress={() => setShowImportInputModal(true)}
        />
        <CopyButton color="black" name="copy" onPress={() => copyToClip()} />
      </HeaderWrapper>
      {items[0]?.dateTime && (
        <SubTitle>
          Time Passed: {"   "}
          {isAfter(new Date(items[0]?.dateTime), new Date()) && "- "}
          {
            intervalToDuration({
              start: new Date(items[0].dateTime),
              end: new Date(),
            }).days
          }{" "}
          days{" "}
          {
            intervalToDuration({
              start: new Date(items[0].dateTime),
              end: new Date(),
            }).hours
          }{" "}
          hours{" "}
          {
            intervalToDuration({
              start: new Date(items[0].dateTime),
              end: new Date(),
            }).minutes
          }{" "}
          minutes{" "}
        </SubTitle>
      )}
      <ButtonWrapper>
        <AddButton
          name="plus"
          onPress={() => addItem(currentKey + 1, new Date().toString())}
          onLongPress={() => setShowInputModal(true)}
        >
          Add Item
        </AddButton>
      </ButtonWrapper>
      <DialogInput
        title="Item Id"
        hintInput="Enter new item's id"
        isDialogVisible={showInputModal}
        submitInput={(input) => {
          addItem(input, new Date().toString());
          setShowInputModal(false);
        }}
        closeDialog={() => setShowInputModal(false)}
      />
      <DialogInput
        title="Import Data"
        hintInput="Paste the JSON data"
        isDialogVisible={showImportInputModal}
        submitInput={(input) => {
          importData(input);
          setShowImportInputModal(false);
        }}
        closeDialog={() => setShowImportInputModal(false)}
      />
      <DateTimePickerModal
        mode="datetime"
        isVisible={showDatePicker}
        onConfirm={(date) => {
          editItem(selectedItem, new Date(date).toString());
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
      <ListWrapper>
        <ScrollView>
          <View>
            {items.map(({ id, dateTime }) => (
              <ListItem
                key={id}
                onPress={() => {
                  setSelectedItem(id);
                  setShowDatePicker(true);
                }}
                onLongPress={() => {
                  setSelectedItem(id);
                  showDeleteItem(id);
                }}
              >
                <Text style={{ color: "black" }}>
                  {id +
                    "          -          " +
                    format(new Date(dateTime), "h:mm:ss aa  dd MMM, Y")}
                </Text>
              </ListItem>
            ))}
          </View>
        </ScrollView>
      </ListWrapper>
    </Container>
  );
}
