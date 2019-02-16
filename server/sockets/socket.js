const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');
const { crearMensaje } = require('../utils/utils');

const usuarios = new Usuarios();

io.on('connection', (client) => {

    client.on('entrarChat', (data, call) => {
        
        if ( !data.nombre || !data.sala ) {
            return call({
                error: true,
                mensaje: 'El nombre es neseario'
            })
        }
        
        client.join(data.sala);

        let personas = usuarios.agregarPersona( client.id, data.nombre, data.sala );

        client.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSala( data.sala ) );

        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('Admin', `${data.nombre} se unio`));

        call(personas);
        
    });

    client.on('crearMensaje', (data, callback) => {
        

        let persona = usuarios.getPersona(client.id);

        let mensaje = crearMensaje( persona.nombre, data.mensaje );

        client.broadcast.to(persona.sala).emit( 'crearMensaje', mensaje );

        callback(mensaje);
    });

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPeronsa( client.id );

        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Admin', `${personaBorrada.nombre} ha salido del chat`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala( personaBorrada.sala ) );

    });

    client.on('mensajePrivado', (data) => {

        let persona = usuarios.getPersona( client.id );
        client.broadcast.to(data.to).emit('mensajePrivado', crearMensaje( persona.nombre, data.mensaje ));

    });
});