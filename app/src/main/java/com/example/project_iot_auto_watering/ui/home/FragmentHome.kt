package com.example.project_iot_auto_watering.ui.home

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.MainViewModel
import com.example.project_iot_auto_watering.MainViewModelFactory
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.data.model.request.CreateGarden
import com.example.project_iot_auto_watering.data.model.response.DataEspAll
import com.example.project_iot_auto_watering.data.model.response.EspDevice
import com.example.project_iot_auto_watering.data.model.response.Garden
import com.example.project_iot_auto_watering.data.repository.AuthRepository
import com.example.project_iot_auto_watering.data.repository.GardenRepository
import com.example.project_iot_auto_watering.data.repository.MainRepository
import com.example.project_iot_auto_watering.data.retrofit.RetrofitInstance
import com.example.project_iot_auto_watering.databinding.FragmentHomeBinding
import com.example.project_iot_auto_watering.ui.home.adapter.CropsAdapter
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenVMFactory
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenViewModel
import com.example.project_iot_auto_watering.ui.login.viewmodel.AuthViewModel
import com.example.project_iot_auto_watering.ui.login.viewmodel.AuthViewModelFactory
import com.example.project_iot_auto_watering.util.NavOption
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDate


class FragmentHome : Fragment(), View.OnClickListener,
    CropsAdapter.OnCropsClickListener, OnClickDialog, ClickAddCrops {
    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    private var listGarden: MutableList<Garden> = mutableListOf()

    private var listEspDevice: MutableList<DataEspAll> = mutableListOf()
    private lateinit var adapterCrops: CropsAdapter
    private lateinit var rcvCrops: RecyclerView
    private val mainRepository = MainRepository(RetrofitInstance.api)
    private lateinit var mainViewModel: MainViewModel
    private lateinit var viewModelAuth: AuthViewModel
    private val authRepository = AuthRepository(RetrofitInstance.api)
    private val gardenRepository = GardenRepository(RetrofitInstance.api)
    private lateinit var viewModelGarden: GardenViewModel

    private lateinit var token: String

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        //data test
        //handle backPressed
        requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner, object :
            OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (isVisible) {
                    val dialogExit = AlertDialog.Builder(requireContext())
                        .setTitle("Thoát")
                        .setMessage("Bạn có muốn thoát app không?")
                        .setPositiveButton("Có") { _, _ -> requireActivity().finish() }
                        .setNegativeButton("Không", null)
                    dialogExit.show()
                }
            }
        })


        //initViewModel
        initViewModel()
        initListener()
        initAdapter()
        initObserve()

        token = viewModelAuth.tokenAuth.toString()
        getListGarden()
        getListEspDeviceAll()

        callApi15PerSecond()
    }

    private fun initListener() {

    }

    private fun initAdapter() {
        adapterCrops = CropsAdapter(listGarden, listEspDevice, this)
        rcvCrops = binding.rcvListCrops
        rcvCrops.layoutManager = LinearLayoutManager(requireContext())
        rcvCrops.adapter = adapterCrops

    }

    override fun onClick(p0: View?) {

    }


    override fun onBlankClick() {
        FragmentDialogCrops(this).show(parentFragmentManager, "CustomDialog")
    }

    override fun onCropsClick(
        garden: Garden
    ) {
        viewModelGarden.idGarden = garden.id
        viewModelGarden.espId=garden.espId
        mainViewModel.idPlant = garden.plantId
        mainViewModel.nameGarden = garden.name
        findNavController().navigate(
            R.id.action_fragmentHomeContainer_to_fragmentCrops, null,
            NavOption.animationFragment
        )
    }

    override fun onClickIconAdd() {
        //truyền ngữ cảnh biết đc interface và chạy các hàm ghi đè khi được có sự kiện
        FragmentDialogAdd(this).show(parentFragmentManager, "Add")
    }

    //thêm vường từ danh sách cây do hệ thống cung cấp
    override fun onClickItemCrop(nameCrops: String, id: Int) {
        val garden = CreateGarden(nameCrops, id)
        viewModelGarden.createGarden(garden, token) { log ->
            Toast.makeText(requireContext(), log, Toast.LENGTH_SHORT).show()
        }
    }

    //tự tạo từ người dùng
    override fun addCrops(nameCrops: String, id: Int) {
        val garden = CreateGarden(nameCrops, id)
        viewModelGarden.createGarden(garden, token) { log ->
            Toast.makeText(requireContext(), log, Toast.LENGTH_SHORT).show()
        }
    }

    private fun initViewModel() {
        viewModelAuth =
            ViewModelProvider(
                requireActivity(),
                AuthViewModelFactory(authRepository)
            )[AuthViewModel::class.java]

        mainViewModel = ViewModelProvider(
            requireActivity(),
            MainViewModelFactory(mainRepository)
        )[MainViewModel::class.java]

        fetchData()

        mainViewModel.getIdUser(viewModelAuth.emailLogin.toString())

        viewModelGarden = ViewModelProvider(
            requireActivity(),
            GardenVMFactory(gardenRepository)
        )[GardenViewModel::class.java]
    }

    @SuppressLint("NotifyDataSetChanged")
    private fun initObserve() {
        viewModelGarden.listGarden.observe(viewLifecycleOwner) { list ->
            binding.progressBar.visibility= View.GONE
            listGarden.clear()
            listGarden.addAll(list)
            adapterCrops.notifyDataSetChanged()
        }

        viewModelGarden.listEspDevice.observe(viewLifecycleOwner) { listEsp ->
            listEspDevice.clear()
            listEspDevice.addAll(listEsp)
            adapterCrops.notifyDataSetChanged()
        }
    }

    private fun fetchData() {
        binding.progressBar.visibility= View.VISIBLE
        mainViewModel.getAllPlant()
    }

    private fun getListGarden() {
        viewModelGarden.getListGarden(token)
    }

    private fun getListEspDeviceAll() {
        viewModelGarden.getAllDataEsp(token) {}
    }

//    private fun callApi15PerSecond() {
//        lifecycleScope.launch {
//            while (true){
//                delay(15000)
//                getListEspDeviceAll()
//            }
//
//        }
//    }

    //sử dụng flow
    private fun callApi15PerSecond() {
        lifecycleScope.launch {
            flow {
                while (isActive) {
                    emit(Unit)
                    delay(15000)
                }
            }.collect {
                getListEspDeviceAll()
            }
        }

    }

}