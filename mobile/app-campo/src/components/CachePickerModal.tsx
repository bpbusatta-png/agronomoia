import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native'

interface Props<T> {
  visible: boolean
  title: string
  items: T[]
  labelFor: (item: T) => string
  onSelect: (item: T) => void
  onClose: () => void
}

export function CachePickerModal<T extends { id: string }>({
  visible,
  title,
  items,
  labelFor,
  onSelect,
  onClose,
}: Props<T>) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable style={styles.item} onPress={() => onSelect(item)}>
                <Text style={styles.itemText}>{labelFor(item)}</Text>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Nada sincronizado ainda</Text>}
          />
          <Pressable style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    maxHeight: '70%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemText: {
    fontSize: 14,
    color: '#08060d',
  },
  empty: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  close: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeText: {
    color: '#dc2626',
    fontSize: 14,
  },
})
