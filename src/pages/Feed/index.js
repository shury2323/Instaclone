import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, View, Button, TextInput, TouchableOpacity, Image, Text} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios'
import LazyImage from '../../components/LazyImage';
import { AsyncStorage } from 'react-native';


import { Container, Post, Header, Avatar, Name, Description, Loading } from './styles';

export default function Feed(props) {
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [feed, setFeed] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [comments, setComments] = useState([])
  const [viewable, setViewable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [text, setText] = useState('');
  const [myLikes, setMyLikes] = useState([]);
  const [users, setUsers] = useState([]);
  const userName = props.route.params.userName;
  const userId = props.route.params.userId;
  const userAvatar = props.route.params.userAvatar;
  const MAX_LENGTH = 200;

  async function loadPage(pageNumber = page, shouldRefresh = false) {
    if(total && pageNumber > total) return;
    if (loading) return;
    
    setLoading(true);

    axios
    .get(`https://5fc9688a3c1c220016440c1b.mockapi.io/posts`)
    .then(response => {
      const totalItems = response.headers["X-Total-Count"]
      const data = response.data
      getLikes();
      getUsers();
      setTotal(Math.floor(totalItems / 5));
      setPage(pageNumber + 1);
      setFeed(shouldRefresh ? data : [...feed, ...data]);
    })

    .catch(err => {
      setError(err.message);
      setLoading(true)
    })
  }
  async function getUsers() {
    
    setLoading(true);
    
    axios
    .get(`https://5fc9688a3c1c220016440c1b.mockapi.io/users`)
    .then(response => {
      const data = response.data;
      setUsers(data);
      setLoading(false);

    })
    .catch(err => {
      setError(err.message);
      setLoading(false)
    })
  }

  async function getLikes() {
    if (loading || !userId ) return;
    
    setLoading(true);
    
    axios
    .get(`https://5fc9688a3c1c220016440c1b.mockapi.io/likes`)
    .then(response => {
      const data = response.data
      console.log(data.filter((item) => {
        return item.id_usuario === userId;
     }));
      setMyLikes(data.filter((item) => {
        return item.id_usuario === userId;
     }));
      

    })
    .catch(err => {
      setError(err.message);
      setLoading(false)
    })
    .finally(()=>{setLoading(false)});
  }

  async function like(postId) {
    if (loading || !userId || !userName || !userAvatar) return;
    const undoLike = myLikes.filter((lk)=>{return lk.ID_post===postId});
    setLoading(true);
    if(undoLike.length){
      axios
    .delete(`https://5fc9688a3c1c220016440c1b.mockapi.io/likes/${undoLike[0].id}`)
    .then(response => {
      console.log(response);
      setLoading(false);
      loadPage(1,true);
    })
    
    .catch(err => {
      setError(err.message);
      setLoading(true)
    })
    }else{

    axios
    .post(`https://5fc9688a3c1c220016440c1b.mockapi.io/likes`, {ID_post:postId, id_usuario:userId, name:userName, avatar:userAvatar})
    .then(response => {
      console.log(response);
      setLoading(false);
      refreshList();
    })
    
    .catch(err => {
      setError(err.message);
      setLoading(true)
    })
  }
}
  

  async function refreshList() {
    setRefreshing(true);
    
    await loadPage(1, true);

    setRefreshing(false);
  }


  const onGet = (id) => {
    try {

      const value = AsyncStorage.getItem(id);

      if (value !== null) {
        setComments(value)
      } 

    } 
      catch (error) {
      }

  }

  const onSave = async (id) => {
    try {
      await AsyncStorage.setItem(id, text);
      setComments([...comments, ...text])
    } catch (error) {
    }
  }
  useEffect(() => {
    loadPage()
  }, []);

  const renderItem = ({item}) => {
    let counter =0;
    return (
      <Post key = {item.id}>
            <Header>
              <Avatar source={{ uri: item.author.avatar }} />
              <Name>{item.author.name}</Name>
            </Header>

            <LazyImage
              aspectRatio={item.aspectRatio} 
              shouldLoad={viewable.includes(item.id)} 
              smallSource={{ uri: item.small }}
              source={{ uri: item.image }}
            />
              
        <View style ={{flexDirection:'row'}}>
        
        <TouchableOpacity
            onPress ={()=>like(item.id)}
          > 
          <Image style={styles.heartIcon}source={myLikes.some((lk)=>{return lk.ID_post===item.id})
            ? require("../../../assets/heart.png")
            : require("../../../assets/heart-outline.png")}/>

        </TouchableOpacity>


        <TouchableOpacity
            onPress={()=>{navigation.push("Likes", {post: item.id})}}>
          
          <Text style={styles.cadastro}>Lista de curtidas</Text>
          

        </TouchableOpacity>

        
        <TouchableOpacity  >
          
          <Image style={styles.heartIcon} source={require("../../../assets/comments.png")}
          />      

        </TouchableOpacity>

        </View >

        <View style={styles.comentarios}>
              <Name style={styles.nameComent}>{item.author.name} </Name>
              <Text>{item.description}</Text>
        </View>


       <View style={styles.campoComents}>

       <Image style={styles.avatarIcon} source={require("../../../assets/iconAvatar.png")}
          />      

            <TextInput
              multiline={true}
              onChangeText={(text) => setText(text)}
              placeholder={"Adicione um Comentário..."}
              style={[styles.text]}
              maxLength={MAX_LENGTH}
              />
   

       <TouchableOpacity  title="Publicar" onPress={() => comment(item.id)} accessibilityLabel="Publicar">
        <Image source={require('../../../assets/sendIcon.png')}  style={styles.sendIcon}/>
      </TouchableOpacity>
    
    
        </View>
            
      </Post>
    )
  }
  
  const handleViewableChanged = useCallback(({ changed }) => {
    setViewable(changed.map(({ item }) => item.id));
  }, []);

  return (
    <Container>
      <FlatList
        key="list"
        data={feed}
        keyExtractor={(item, index)=> String(item.id + index)}
        renderItem={renderItem}
        ListFooterComponent={loading && <Loading />}
        onViewableItemsChanged={handleViewableChanged}
        viewabilityConfig={{
          viewAreaCoveragePercentThreshold: 10,
        }}
        showsVerticalScrollIndicator={false}
        onRefresh={refreshList}
        refreshing={refreshing}
        onEndReachedThreshold={0.1}
        onEndReached={() => loadPage()}
      />
    </Container>
  );
}

const styles = StyleSheet.create(
  {text: {
    fontSize: 13,
    lineHeight: 50,
    marginTop: 20,
    marginLeft: 5,
    marginBottom: 5,
    width: '80%',
    height: '30%',
  },
  comentarios: {
    flexDirection: "row",
    marginLeft: 10,
    marginTop: 10,
    marginBottom: 5,
  },
  nameComent: {
    fontWeight: 'bold',
  },
  heartIcon: {
    width: 20,
    height: 20,
    marginLeft:15,
    marginRight: 5,
    marginTop:10,
  },
  campoComents: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderLeftColor: '#c9c9c9',
    borderRightColor: '#c9c9c9',
    borderTopColor: '#c9c9c9',
    borderBottomColor: '#c9c9c9',
  },
   sendIcon: {
    width: 30,
    height: 30,
    marginLeft: 5,
    marginTop: 10,
    marginBottom: 1,
   },
   avatarIcon: {
    width: 30,
    height: 30,
    marginLeft: 5,
    marginTop: 10,
    marginBottom: 5,
   },
   cadastro: {
    color: '#000',
    fontWeight: 'bold',
    marginTop: 14,
    marginLeft: 15,
    textDecorationLine: 'underline',
    marginLeft: 5
	}
})