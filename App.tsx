import { useState, useEffect } from 'react'
import { StatusBar } from 'react-native'
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Clipboard,
  ToastAndroid
} from 'react-native'
import * as SQLite from 'expo-sqlite'
import styled from 'styled-components/native'
import { format, intervalToDuration, isAfter, isBefore } from 'date-fns'
import DialogInput from 'react-native-dialog-input'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import {
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons
} from '@expo/vector-icons'

const AddButton = styled(FontAwesome.Button)`
  background-color: #665c71;
`
const CopyButton = styled(FontAwesome5.Button)`
  background-color: #161616;
`
const ImportButton = styled(MaterialCommunityIcons.Button)`
  background-color: #161616;
`
const ListItem = styled(TouchableOpacity)`
  padding: 20px;
  border-bottom-width: 1px;
  color: #9a9a9a;
  border-bottom-color: #9a9a9a;
`

const ButtonsWrapper = styled.View`
  display: flex;
  flex-direction: row;
`
const HeaderWrapper = styled.View`
  display: flex;
  width: 100%;
  margin-bottom: 10px;
  padding: 20px;
  padding-top: 50px;
  background-color: #161616;
  padding-left: 10px;
  padding-bottom: 2px;
  padding-right: 10px;
  margin-bottom: 20px;
  justify-content: space-between;
  flex-direction: row;
`

const Container = styled.View`
  flex: 1;
  background-color: #000000;
  justify-content: center;
  align-items: center;
`

const ListWrapper = styled.View`
  border-top-width: 1px;
  border-top-color: #9a9a9a;
  padding: 1px;
  flex: 1;
`

const Title = styled.Text`
  font-size: 26px;
  color: #9a9a9a;
  padding-right: 55px;
  align-self: flex-start;
`

const SubTitle = styled.View`
  padding-left: 20px;
  padding-right: 20px;
  color: #9a9a9a;
  flex-direction: row;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-self: flex-start;
`

const SubTitleText = styled.Text`
  color: #9a9a9a;
  font-size: 15px;
`
const ButtonWrapper = styled.View`
  margin-top: 100px;
  margin-bottom: 80px;
`

const db = SQLite.openDatabase('pop')

export default function App() {
  const [currentKey, setCurrentKey] = useState(0)
  const [items, setItems] = useState([])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showInputModal, setShowInputModal] = useState(false)
  const [showImportInputModal, setShowImportInputModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const [time, setTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const showDeleteItem = (id?: string) => {
    Alert.alert(
      'Are you sure?',
      id
        ? 'You are about to delete this. Do you want to continue?'
        : 'You are about to delete All. Do you want to continue?',
      [
        {
          text: 'No'
        },
        {
          text: 'Yes',
          onPress: () => {
            id ? deleteItem(id) : deleteAll()
          }
        }
      ],
      { cancelable: true }
    )
  }

  const copyToClip = () => {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from items ORDER BY id DESC;`,
        null,
        (_, { rows: { _array } }) => {
          Clipboard.setString(JSON.stringify(_array))
          ToastAndroid.show('Copied all data!', ToastAndroid.SHORT)
        }
      )
    })
  }

  const importData = (dataString: string) => {
    const dataArray = JSON.parse(dataString)
    dataArray.forEach((item) => {
      db.transaction((tx) => {
        tx.executeSql('insert into items (id, dateTime) values (?,?)', [
          item.id,
          item.dateTime
        ])
      })
    })
    refreshState()
  }

  const refreshState = () => {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from items ORDER BY id DESC;`,
        null,
        (_, { rows: { _array } }) => {
          setItems(_array)
          _array[0]?.id && setCurrentKey(_array[0]?.id)
        }
      )
    })
  }

  useEffect(() => {
    StatusBar.setBackgroundColor('#161616')
    StatusBar.setBarStyle('light-content')
    StatusBar.setTranslucent(true)
    db.transaction((tx) => {
      tx.executeSql(
        'create table if not exists items (id integer primary key not null, dateTime text);'
      )
    })
    refreshState()
  }, [])

  const addItem = (id: number, text: string) => {
    db.transaction((tx) => {
      tx.executeSql('insert into items (id, dateTime) values (?,?)', [id, text])
    })
    refreshState()
  }

  const editItem = (id: number, text: string) => {
    db.transaction((tx) => {
      tx.executeSql('update items set dateTime=? where id=?', [text, id])
    })
    refreshState()
  }

  const deleteItem = (id) => {
    db.transaction((tx) => {
      tx.executeSql('delete from items where id=?', [id])
    })
    refreshState()
  }

  const deleteAll = () => {
    db.transaction((tx) => {
      tx.executeSql('delete from items')
    })
    refreshState()
    setCurrentKey(0)
  }

  const days =
    items.length &&
    intervalToDuration({
      start: new Date(items[0]?.dateTime),
      end: new Date()
    }).days

  const hours =
    items.length &&
    intervalToDuration({
      start: new Date(items[0]?.dateTime),
      end: new Date()
    }).hours
  const minutes =
    items.length &&
    intervalToDuration({
      start: new Date(items[0]?.dateTime),
      end: new Date()
    }).minutes
  const seconds =
    items.length &&
    intervalToDuration({
      start: new Date(items[0]?.dateTime),
      end: new Date()
    }).seconds

  return (
    <Container>
      <HeaderWrapper>
        <Title> Counter </Title>
        <ButtonsWrapper>
          <View>
            <CopyButton
              color="#9a9a9a"
              name="trash"
              onLongPress={() => showDeleteItem()}
            />
          </View>
          <View>
            <ImportButton
              color="#9a9a9a"
              name="database-import"
              onPress={() => setShowImportInputModal(true)}
            />
          </View>
          <View>
            <CopyButton
              color="#9a9a9a"
              name="copy"
              onPress={() => copyToClip()}
            />
          </View>
        </ButtonsWrapper>
      </HeaderWrapper>
      {items[0]?.dateTime && (
        <SubTitle>
          <SubTitleText>Time Passed: </SubTitleText>
          <SubTitleText>
            {isAfter(new Date(items[0]?.dateTime), new Date()) && '- '}
            {days !== 0 && days + ' days' + ' '}
            {hours !== 0 && hours + ' hours' + ' '}
            {minutes !== 0 && minutes + ' mins' + ' '}
            {seconds + ' secs' + ' '}
          </SubTitleText>
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
          addItem(input, new Date().toString())
          setShowInputModal(false)
        }}
        closeDialog={() => setShowInputModal(false)}
      />
      <DialogInput
        title="Import Data"
        hintInput="Paste the JSON data"
        isDialogVisible={showImportInputModal}
        submitInput={(input) => {
          importData(input)
          setShowImportInputModal(false)
        }}
        closeDialog={() => setShowImportInputModal(false)}
      />
      <DateTimePickerModal
        mode="datetime"
        isVisible={showDatePicker}
        onConfirm={(date) => {
          const finalDate = new Date(date).setSeconds(new Date().getSeconds())
          editItem(selectedItem, new Date(finalDate).toString())
          setShowDatePicker(false)
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
                  setSelectedItem(id)
                  setShowDatePicker(true)
                }}
                onLongPress={() => {
                  setSelectedItem(id)
                  showDeleteItem(id)
                }}
              >
                <Text style={{ color: '#9a9a9a' }}>
                  {id +
                    '          -          ' +
                    format(new Date(dateTime), 'h:mm:ss aa  dd MMM, Y')}
                </Text>
              </ListItem>
            ))}
          </View>
        </ScrollView>
      </ListWrapper>
    </Container>
  )
}
